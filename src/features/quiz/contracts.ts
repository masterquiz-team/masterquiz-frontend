import type { PlayerAttempt, PlayerQuiz, PlayerQuizPage } from "./types";

import { invalidContract } from "@/lib/api/errors";
import {
  isRecord as record,
  isId as id,
  isText as text,
  parseSpringPage,
} from "@/lib/validation";

// Compatibility export: all contract failures now use the shared error type.
export { ContractError as QuizContractError } from "@/lib/api/errors";
const invalid = invalidContract;

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
  return parseSpringPage(v, parsePlayerQuiz);
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
