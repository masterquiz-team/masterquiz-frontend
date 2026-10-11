import "server-only";

import type { Question, QuestionInput, QuestionRecord } from "../types";
import { parseCategory } from "@/features/categories/server/api";
import {
  backendRequest,
  deleteBackend,
  invalidContract,
  isId,
  isRecord,
  jsonBody,
  requireId,
  requireText,
} from "@/lib/api/server";

function parseQuestion(value: unknown): QuestionRecord {
  if (
    !isRecord(value) ||
    !isId(value.id) ||
    typeof value.text !== "string" ||
    typeof value.feedback !== "string" ||
    typeof value.answerCounter !== "number" ||
    !Number.isInteger(value.answerCounter) ||
    value.answerCounter < 0 ||
    typeof value.correctAnswer !== "boolean"
  )
    invalidContract();
  return {
    id: value.id,
    text: value.text,
    feedback: value.feedback,
    answerCounter: value.answerCounter,
    correctAnswer: value.correctAnswer,
    category: parseCategory(value.category),
  };
}

export function toQuestion({ id, text, category }: QuestionRecord): Question {
  return { id, text, category };
}

export function getQuestions(categoryName: string): Promise<QuestionRecord[]> {
  const query = new URLSearchParams({
    categoryName: requireText(categoryName, "categoryName", 2, 20),
  });
  return backendRequest(`/questions?${query}`, (value) => {
    if (!Array.isArray(value)) invalidContract();
    return value.map(parseQuestion);
  });
}

// On backend 2a30955 these two endpoints return 403 because of @PreAuthorize.
export const getQuestion = (id: number) =>
  backendRequest(`/questions/${requireId(id)}`, parseQuestion);

function questionInput(input: QuestionInput): QuestionInput {
  return {
    text: requireText(input.text, "text", 2, 30),
    feedback: requireText(input.feedback, "feedback", 2, 30),
    categoryId: requireId(input.categoryId, "categoryId"),
  };
}

export const createQuestion = (input: QuestionInput) =>
  backendRequest(
    "/questions",
    parseQuestion,
    jsonBody("POST", questionInput(input)),
  );
export const updateQuestion = (id: number, input: QuestionInput) =>
  backendRequest(
    "/questions",
    parseQuestion,
    jsonBody("PUT", { id: requireId(id), ...questionInput(input) }),
  );
export const deleteQuestion = (id: number) =>
  deleteBackend(`/questions/${requireId(id)}`);
