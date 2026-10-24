import type {
  AnswerReveal,
  PlayerAttempt,
  PlayerQuiz,
  RecordedAnswer,
  SubmittedAnswer,
} from "./types";
import type { ContextOption, RevealedOption } from "./server/game-view";
import { getDifficultyByApiName } from "./difficulty";

import { invalidContract } from "@/lib/api/errors";
import {
  isRecord as record,
  isId as id,
  isText as text,
} from "@/lib/validation";

// Compatibility export: all contract failures now use the shared error type.
export { ContractError as QuizContractError } from "@/lib/api/errors";
const invalid = invalidContract;

function parseReveal(
  value: Record<string, unknown>,
  answer: { answerId: number; correctAnswer: boolean },
): AnswerReveal {
  const ids = value.correctAnswerIds;
  if (
    !id(value.questionId) ||
    !Array.isArray(ids) ||
    !ids.every(id) ||
    new Set(ids).size !== ids.length ||
    !(value.feedback == null || typeof value.feedback === "string") ||
    ids.includes(answer.answerId) !== answer.correctAnswer
  )
    return invalid();
  return {
    questionId: value.questionId,
    correctAnswerIds: ids,
    feedback:
      typeof value.feedback === "string" && value.feedback.trim()
        ? value.feedback
        : null,
  };
}

export function parseRecordedAnswer(value: unknown): RecordedAnswer {
  if (
    !record(value) ||
    !(value.id === undefined || id(value.id)) ||
    !id(value.quizAttemptId) ||
    !id(value.answerId) ||
    typeof value.correctAnswer !== "boolean"
  )
    return invalid();
  const answer = {
    ...(value.id === undefined ? {} : { id: value.id }),
    quizAttemptId: value.quizAttemptId,
    answerId: value.answerId,
    correctAnswer: value.correctAnswer,
  };
  // History leaves these fields null today; use them once the backend fills them.
  return value.questionId == null || value.correctAnswerIds == null
    ? answer
    : { ...answer, reveal: parseReveal(value, answer) };
}

export function parseSubmittedAnswer(value: unknown): SubmittedAnswer {
  const { reveal, ...answer } = parseRecordedAnswer(value);
  if (!record(value)) return invalid();
  return { ...answer, ...(reveal ?? parseReveal(value, answer)) };
}

const localDateTime = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?$/.test(v) &&
  Number.isFinite(Date.parse(`${v}Z`));

// Explicit allowlists: never spread upstream entities into player responses.
export function parsePlayerQuiz(v: unknown): PlayerQuiz {
  const difficulty = record(v) ? getDifficultyByApiName(v.difficulty) : null;
  if (
    !record(v) ||
    !id(v.id) ||
    !text(v.title) ||
    !difficulty ||
    !id(v.categoryId) ||
    !Array.isArray(v.listOfQuestions)
  )
    return invalid();
  const listOfQuestions = v.listOfQuestions.map((q: unknown) => {
    if (!record(q) || !id(q.id) || !text(q.text)) return invalid();
    return { id: q.id, text: q.text };
  });
  if (new Set(listOfQuestions.map((q) => q.id)).size !== listOfQuestions.length)
    return invalid();
  return {
    id: v.id,
    title: v.title,
    difficulty: difficulty.id,
    categoryId: v.categoryId,
    listOfQuestions,
  };
}
export function parsePlayerAttempt(v: unknown): PlayerAttempt {
  if (
    !record(v) ||
    !id(v.id) ||
    !id(v.quizId) ||
    !localDateTime(v.startedAt) ||
    !(v.finishedAt === null || localDateTime(v.finishedAt)) ||
    !(v.status === "IN_PROGRESS" || v.status === "FINISHED")
  )
    return invalid();
  // Keep Java LocalDateTime verbatim; the gameplay BFF interprets it as UTC.
  return {
    id: v.id,
    quizId: v.quizId,
    startedAt: v.startedAt,
    finishedAt: v.finishedAt,
    status: v.status,
  };
}

export function parsePlayerOptions(
  value: unknown,
  questionId: number,
): ContextOption[] {
  if (!Array.isArray(value) || value.length < 2) return invalid();
  const options = value.map((raw) => {
    if (
      !record(raw) ||
      !id(raw.id) ||
      typeof raw.text !== "string" ||
      !raw.text.trim() ||
      raw.questionId !== questionId ||
      !Number.isSafeInteger(raw.points) ||
      (raw.points as number) < 0
    )
      return invalid();
    // The Java player endpoint currently leaks correct. Discard it here.
    return {
      id: raw.id,
      text: raw.text,
      questionId,
      points: raw.points as number,
    };
  });
  if (new Set(options.map((a) => a.id)).size !== options.length)
    return invalid();
  return options;
}

export function parseRevealedOptions(
  value: unknown,
  questionId: number,
): RevealedOption[] {
  if (!Array.isArray(value)) return invalid();
  return value.map((raw) => {
    if (
      !record(raw) ||
      !id(raw.id) ||
      raw.questionId !== questionId ||
      typeof raw.correct !== "boolean"
    )
      return invalid();
    return { id: raw.id, correct: raw.correct };
  });
}
