import type { PlayerAttempt, PlayerQuiz, PlayerQuizPage } from "./types";

export class QuizContractError extends Error {}
const invalid = (): never => {
  throw new QuizContractError("Unexpected quiz response.");
};
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const id = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v > 0;
const text = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

const localDateTime = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?$/.test(v) &&
  Number.isFinite(Date.parse(v));

// Explicit allowlists: never spread upstream entities into player responses.
export function parsePlayerQuiz(v: unknown): PlayerQuiz {
  if (
    !record(v) ||
    !id(v.id) ||
    !text(v.title) ||
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
    categoryId: v.categoryId,
    listOfQuestions,
  };
}
export function parsePlayerQuizPage(v: unknown): PlayerQuizPage {
  if (!record(v) || !Array.isArray(v.content)) return invalid();
  const { number, size, totalElements, totalPages, first, last, empty } = v;
  if (
    typeof number !== "number" ||
    typeof size !== "number" ||
    typeof totalElements !== "number" ||
    typeof totalPages !== "number" ||
    ![number, size, totalElements, totalPages].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    ) ||
    size < 1 ||
    typeof first !== "boolean" ||
    typeof last !== "boolean" ||
    typeof empty !== "boolean"
  )
    return invalid();
  const content = v.content.map(parsePlayerQuiz);
  if (content.length > size || empty !== (content.length === 0))
    return invalid();
  return {
    content,
    number,
    size,
    totalElements,
    totalPages,
    first,
    last,
    empty,
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
  // LocalDateTime is kept verbatim; it is not an authoritative deadline.
  return {
    id: v.id,
    quizId: v.quizId,
    startedAt: v.startedAt,
    finishedAt: v.finishedAt,
    status: v.status,
  };
}
export function parseStartInput(v: unknown): { quizId: number } {
  if (!record(v) || Object.keys(v).length !== 1 || !id(v.quizId))
    throw new QuizContractError("Only a positive integer quizId is accepted.");
  return { quizId: v.quizId };
}
