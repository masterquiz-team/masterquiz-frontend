import "server-only";
import {
  ApiError,
  invalidContract,
  isId,
  isRecord,
  jsonBody,
} from "@/lib/api/server";
import { getCategory } from "@/features/categories/server/api";
import { parsePlayerAttempt, parsePlayerQuiz } from "../contracts";
import type { GameView, PlayerOption, RecordedAnswer } from "../types";
import { getQuizAttempt, quizRequest } from "./api";

export function parseRecordedAnswer(value: unknown): RecordedAnswer {
  if (
    !isRecord(value) ||
    !isId(value.id) ||
    !isId(value.quizAttemptId) ||
    !isId(value.answerId) ||
    typeof value.correctAnswer !== "boolean"
  )
    invalidContract();
  return {
    id: value.id,
    quizAttemptId: value.quizAttemptId,
    answerId: value.answerId,
    correctAnswer: value.correctAnswer,
  };
}
export async function getHistory(attemptId: number) {
  return quizRequest(`/quiz-attempts/answers/${attemptId}`, (value) => {
    if (!Array.isArray(value)) invalidContract();
    const history = value.map(parseRecordedAnswer);
    if (
      history.some((a) => a.quizAttemptId !== attemptId) ||
      new Set(history.map((a) => a.id)).size !== history.length
    )
      invalidContract();
    return history;
  });
}
export async function recordAnswer(attemptId: number, answerId: number) {
  return quizRequest(
    "/quiz-attempts/answers/create",
    (value) => {
      const answer = parseRecordedAnswer(value);
      if (answer.quizAttemptId !== attemptId || answer.answerId !== answerId)
        invalidContract();
      return answer;
    },
    jsonBody("POST", { quizAttemptId: attemptId, answerId }),
  );
}
export async function finishAttempt(attemptId: number) {
  return quizRequest(
    `/quiz-attempts/${attemptId}/finish`,
    (value) => {
      const attempt = parsePlayerAttempt(value);
      if (
        attempt.id !== attemptId ||
        attempt.status !== "FINISHED" ||
        !attempt.finishedAt
      )
        invalidContract();
      return attempt;
    },
    { method: "PUT" },
  );
}

type PrivateQuestion = { id: number; text: string; feedback: string | null };
type PrivateQuiz = ReturnType<typeof parsePlayerQuiz> & {
  listOfQuestions: PrivateQuestion[];
};
export async function getPrivateQuiz(id: number): Promise<PrivateQuiz> {
  return quizRequest(`/quiz/${id}`, (value) => {
    const quiz = parsePlayerQuiz(value);
    if (
      quiz.id !== id ||
      quiz.listOfQuestions.length !== 10 ||
      !isRecord(value) ||
      !Array.isArray(value.listOfQuestions)
    )
      invalidContract();
    const rawQuestions = value.listOfQuestions;
    return {
      ...quiz,
      listOfQuestions: quiz.listOfQuestions.map((q, index) => {
        const raw = rawQuestions[index];
        return {
          ...q,
          feedback:
            isRecord(raw) &&
            typeof raw.feedback === "string" &&
            raw.feedback.trim()
              ? raw.feedback
              : null,
        };
      }),
    };
  });
}
export async function getPlayerOptions(
  questionId: number,
): Promise<PlayerOption[]> {
  return quizRequest(`/answers/question/${questionId}/quiz`, (value) => {
    if (!Array.isArray(value) || value.length < 2) invalidContract();
    const options = value.map((raw) => {
      if (
        !isRecord(raw) ||
        !isId(raw.id) ||
        typeof raw.text !== "string" ||
        !raw.text.trim() ||
        raw.questionId !== questionId
      )
        invalidContract();
      // The Java player endpoint currently leaks correct. Discard it here.
      return { id: raw.id, text: raw.text, questionId };
    });
    if (new Set(options.map((a) => a.id)).size !== options.length)
      invalidContract();
    return options;
  });
}
async function getRevealedOptions(questionId: number) {
  return quizRequest(`/answers/question/${questionId}`, (value) => {
    if (!Array.isArray(value)) invalidContract();
    return value.map((raw) => {
      if (
        !isRecord(raw) ||
        !isId(raw.id) ||
        raw.questionId !== questionId ||
        typeof raw.correct !== "boolean"
      )
        invalidContract();
      return { id: raw.id, correct: raw.correct };
    });
  });
}

export async function loadGame(
  attemptId: number,
  reviewQuestionId?: number,
): Promise<GameView> {
  const attempt = await getQuizAttempt(attemptId);
  const [quiz, history] = await Promise.all([
    getPrivateQuiz(attempt.quizId),
    getHistory(attemptId),
  ]);
  const category = await getCategory(quiz.categoryId);
  if (category.id !== quiz.categoryId || !category.name.trim())
    invalidContract();
  const options = await Promise.all(
    quiz.listOfQuestions.map((q) => getPlayerOptions(q.id)),
  );
  const answerToQuestion = new Map(
    options.flatMap((items, index) => items.map((a) => [a.id, index] as const)),
  );
  if (answerToQuestion.size !== options.flat().length) invalidContract();
  const answered = new Map<number, RecordedAnswer>();
  for (const record of history) {
    const index = answerToQuestion.get(record.answerId);
    if (index === undefined || answered.has(index)) invalidContract();
    answered.set(index, record);
  }
  // Resume from backend history, never from a browser counter.
  for (let i = 0; i < answered.size; i++)
    if (!answered.has(i)) invalidContract();
  const base = {
    attempt,
    category,
    title: quiz.title,
    total: 10,
    answered: answered.size,
  };
  if (attempt.status === "FINISHED") {
    if (answered.size !== 10)
      throw new ApiError(
        409,
        "This attempt was finished before all ten answers were saved.",
      );
    return {
      ...base,
      phase: "finished",
      question: null,
      review: null,
      summary: {
        correct: history.filter((a) => a.correctAnswer).length,
        answered: history.length,
        total: 10,
      },
    };
  }
  const index =
    reviewQuestionId === undefined
      ? answered.size
      : quiz.listOfQuestions.findIndex((q) => q.id === reviewQuestionId);
  if (index < 0 || (reviewQuestionId !== undefined && !answered.has(index)))
    throw new ApiError(409, "Feedback is available only for a saved answer.");
  if (index === 10)
    return {
      ...base,
      phase: "ready-to-finish",
      question: null,
      review: null,
      summary: null,
    };
  const q = quiz.listOfQuestions[index];
  const question = { id: q.id, text: q.text, index, options: options[index] };
  if (reviewQuestionId === undefined)
    return {
      ...base,
      phase: "question",
      question,
      review: null,
      summary: null,
    };
  const record = answered.get(index)!;
  // Correctness/feedback are fetched and released only after history proves submission.
  const revealed = await getRevealedOptions(q.id);
  if (
    revealed.length !== options[index].length ||
    revealed.some((a) => !options[index].some((o) => o.id === a.id)) ||
    new Set(revealed.map((a) => a.id)).size !== revealed.length
  )
    invalidContract();
  const correctOptionIds = revealed.filter((a) => a.correct).map((a) => a.id);
  if (
    !correctOptionIds.length ||
    revealed.find((a) => a.id === record.answerId)?.correct !==
      record.correctAnswer
  )
    invalidContract();
  return {
    ...base,
    phase: "feedback",
    question,
    review: {
      answerId: record.answerId,
      correct: record.correctAnswer,
      correctOptionIds,
      explanation: q.feedback,
    },
    summary: null,
  };
}

const activeMutations = new Set<number>();
export async function withAttemptMutation<T>(
  id: number,
  work: () => Promise<T>,
) {
  if (activeMutations.has(id))
    throw new ApiError(
      409,
      "A request for this attempt is already in progress. Reload saved progress.",
    );
  activeMutations.add(id);
  try {
    return await work();
  } finally {
    activeMutations.delete(id);
  }
}
