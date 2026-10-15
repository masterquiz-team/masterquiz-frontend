import type {
  GameView,
  PlayerAttempt,
  PlayerOption,
  PlayerQuiz,
  RecordedAnswer,
  SubmittedAnswer,
} from "@/features/quiz/types";
import {
  difficultyPoints,
  easyDifficulty,
  type QuestionDifficulty,
} from "@/features/quiz/difficulty";
import { getAttemptDeadline } from "@/features/quiz/timer";

export type GameContext = {
  attempt: PlayerAttempt;
  quiz: Omit<PlayerQuiz, "listOfQuestions"> & {
    listOfQuestions: {
      id: number;
      text: string;
      feedback: string | null;
      difficultyName: QuestionDifficulty;
    }[];
  };
  category: { id: number; name: string };
  options: PlayerOption[][];
};
export type RevealedOption = { id: number; correct: boolean };
export class GameStateError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
function invalid(): never {
  throw new GameStateError(502, "The backend returned an unexpected response.");
}

// No I/O: validate the complete context and map history by stable numeric IDs.
export function getAnsweredQuestions(
  context: GameContext,
  history: RecordedAnswer[],
) {
  const { attempt, quiz, category, options } = context;
  if (
    attempt.quizId !== quiz.id ||
    category.id !== quiz.categoryId ||
    !category.name.trim() ||
    quiz.listOfQuestions.length !== easyDifficulty.questionCount ||
    new Set(quiz.listOfQuestions.map((q) => q.id)).size !==
      quiz.listOfQuestions.length ||
    options.length !== quiz.listOfQuestions.length
  )
    invalid();
  const answerToQuestion = new Map<number, number>();
  options.forEach((items, index) => {
    if (items.length < 2) invalid();
    items.forEach((option) => {
      if (
        option.questionId !== quiz.listOfQuestions[index].id ||
        answerToQuestion.has(option.id)
      )
        invalid();
      answerToQuestion.set(option.id, index);
    });
  });
  const answered = new Map<number, RecordedAnswer>();
  const recordIds = new Set<number>();
  for (const record of history) {
    const index = answerToQuestion.get(record.answerId);
    if (
      record.quizAttemptId !== attempt.id ||
      (record.id !== undefined && recordIds.has(record.id)) ||
      index === undefined ||
      answered.has(index)
    )
      invalid();
    if (record.id !== undefined) recordIds.add(record.id);
    answered.set(index, record);
  }
  // Resume from a contiguous prefix of backend history, never a browser counter.
  for (let index = 0; index < answered.size; index++)
    if (!answered.has(index)) invalid();
  return answered;
}

export function buildGameView(
  context: GameContext,
  history: RecordedAnswer[],
  feedback?: {
    questionId: number;
    options?: RevealedOption[];
    submission?: SubmittedAnswer;
  },
  now = Date.now(),
): GameView {
  const { attempt, quiz, category, options } = context;
  const answered = getAnsweredQuestions(context, history);
  const total = easyDifficulty.questionCount;
  const deadline = getAttemptDeadline(attempt);
  if (!Number.isFinite(deadline)) invalid();
  const base = {
    attempt,
    category,
    title: quiz.title,
    total,
    answered: answered.size,
    score: [...answered].reduce(
      (points, [index, record]) =>
        points +
        (record.correctAnswer
          ? difficultyPoints[quiz.listOfQuestions[index].difficultyName]
          : 0),
      0,
    ),
    timer: {
      deadline: new Date(deadline).toISOString(),
      serverNow: new Date(now).toISOString(),
    },
  };
  if (attempt.status === "FINISHED") {
    const startedAt = Date.parse(`${attempt.startedAt}Z`);
    const finishedAt = attempt.finishedAt
      ? Date.parse(`${attempt.finishedAt}Z`)
      : NaN;
    if (!Number.isFinite(finishedAt) || finishedAt < startedAt) invalid();
    const durationSeconds = easyDifficulty.durationMinutes * 60;
    return {
      ...base,
      phase: "finished",
      nickname: null,
      // Only the player's own chosen text is revealed, after FINISHED. Never
      // serialize the complete options, private feedback or correct-answer key.
      results: quiz.listOfQuestions.map((question, index) => {
        const record = answered.get(index);
        return {
          questionId: question.id,
          questionText: question.text,
          answerText: record
            ? options[index].find((option) => option.id === record.answerId)!
                .text
            : null,
          outcome: record
            ? record.correctAnswer
              ? "correct"
              : "wrong"
            : "skipped",
        };
      }),
      summary: {
        correct: history.filter((a) => a.correctAnswer).length,
        answered: history.length,
        total,
        pointsEarned: base.score,
        maxPoints: quiz.listOfQuestions.reduce(
          (points, question) =>
            points + difficultyPoints[question.difficultyName],
          0,
        ),
        elapsedSeconds: Math.min(
          durationSeconds,
          Math.floor((finishedAt - startedAt) / 1000),
        ),
        durationSeconds,
        totalScore: null,
      },
    };
  }
  if (now >= deadline && answered.size < total)
    return { ...base, phase: "timed-out" };
  const index =
    feedback === undefined
      ? answered.size
      : quiz.listOfQuestions.findIndex((q) => q.id === feedback.questionId);
  if (feedback === undefined && index === total)
    return { ...base, phase: "ready-to-finish" };
  const q = quiz.listOfQuestions[index];
  if (!q)
    throw new GameStateError(
      409,
      "Feedback is available only for a saved answer.",
    );
  // Explicit allowlist: private feedback and correctness never enter a question view.
  const question = { id: q.id, text: q.text, index, options: options[index] };
  if (!feedback) return { ...base, phase: "question", question };
  const record = answered.get(index);
  if (!record)
    throw new GameStateError(
      409,
      "Feedback is available only for a saved answer.",
    );
  const submission = feedback.submission;
  if (
    submission &&
    (submission.questionId !== q.id ||
      submission.quizAttemptId !== attempt.id ||
      submission.answerId !== record.answerId ||
      submission.correctAnswer !== record.correctAnswer ||
      submission.correctAnswerIds.some(
        (id) => !options[index].some((option) => option.id === id),
      ))
  )
    invalid();
  const revealed =
    feedback.options ??
    options[index].map((option) => ({
      id: option.id,
      correct: submission?.correctAnswerIds.includes(option.id) ?? false,
    }));
  if (
    revealed.length !== options[index].length ||
    revealed.some((a) => !options[index].some((o) => o.id === a.id)) ||
    new Set(revealed.map((a) => a.id)).size !== revealed.length
  )
    invalid();
  const correctOptionIds = revealed.filter((a) => a.correct).map((a) => a.id);
  if (
    !correctOptionIds.length ||
    revealed.find((a) => a.id === record.answerId)?.correct !==
      record.correctAnswer
  )
    invalid();
  return {
    ...base,
    phase: "feedback",
    question,
    review: {
      answerId: record.answerId,
      correct: record.correctAnswer,
      pointsEarned: record.correctAnswer
        ? difficultyPoints[q.difficultyName]
        : 0,
      correctOptionIds,
      explanation: submission ? submission.feedback : q.feedback,
    },
  };
}
