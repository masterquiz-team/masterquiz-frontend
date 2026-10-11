import "server-only";

import type { Answer, AnswerInput, AnswerRecord, AnswerUpdate } from "../types";
import {
  backendRequest,
  deleteBackend,
  invalidContract,
  isId,
  isRecord,
  jsonBody,
  requireBoolean,
  requireId,
  requireText,
} from "@/lib/api/server";

function parseAnswer(value: unknown): AnswerRecord {
  if (
    !isRecord(value) ||
    !isId(value.id) ||
    !isId(value.questionId) ||
    typeof value.text !== "string" ||
    typeof value.correct !== "boolean"
  )
    invalidContract();
  return {
    id: value.id,
    text: value.text,
    correct: value.correct,
    questionId: value.questionId,
  };
}

export function toAnswer({ id, text, questionId }: AnswerRecord): Answer {
  return { id, text, questionId };
}

export const getAnswer = (id: number) =>
  backendRequest(`/answers/${requireId(id)}`, parseAnswer);
export function getAnswers(questionId: number): Promise<AnswerRecord[]> {
  return backendRequest(
    `/answers/question/${requireId(questionId, "questionId")}`,
    (value) => {
      if (!Array.isArray(value)) invalidContract();
      return value.map(parseAnswer);
    },
  );
}

function answerInput(input: AnswerUpdate): AnswerUpdate {
  return {
    text: requireText(input.text, "text", 2, 10),
    correct: requireBoolean(input.correct, "correct"),
  };
}

export const createAnswer = (input: AnswerInput) =>
  backendRequest(
    "/answers",
    parseAnswer,
    jsonBody("POST", {
      ...answerInput(input),
      questionId: requireId(input.questionId, "questionId"),
    }),
  );
export const updateAnswer = (id: number, input: AnswerUpdate) =>
  backendRequest(
    "/answers",
    parseAnswer,
    jsonBody("PUT", { id: requireId(id), ...answerInput(input) }),
  );
export const deleteAnswer = (id: number) =>
  deleteBackend(`/answers/${requireId(id)}`);
