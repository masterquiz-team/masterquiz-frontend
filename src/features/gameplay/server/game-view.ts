import type {
  GameView,
  PlayerAttempt,
  PlayerOption,
  PlayerQuiz,
  RecordedAnswer,
} from "@/features/quiz/types";
import { easyDifficulty } from "@/features/quiz/difficulty";

export type GameContext = {
  attempt: PlayerAttempt;
  quiz: PlayerQuiz & {
    listOfQuestions: { id: number; text: string; feedback: string | null }[];
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
      recordIds.has(record.id) ||
      index === undefined ||
      answered.has(index)
    )
      invalid();
    recordIds.add(record.id);
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
  feedback?: { questionId: number; options: RevealedOption[] },
): GameView {
  const { attempt, quiz, category, options } = context;
  const answered = getAnsweredQuestions(context, history);
  const total = easyDifficulty.questionCount;
  const base = {
    attempt,
    category,
    title: quiz.title,
    total,
    answered: answered.size,
  };
  if (attempt.status === "FINISHED") {
    if (answered.size !== total)
      throw new GameStateError(
        409,
        "This attempt was finished before all ten answers were saved.",
      );
    return {
      ...base,
      phase: "finished",
      summary: {
        correct: history.filter((a) => a.correctAnswer).length,
        answered: history.length,
        total,
      },
    };
  }
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
  const revealed = feedback.options;
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
      correctOptionIds,
      explanation: q.feedback,
    },
  };
}
