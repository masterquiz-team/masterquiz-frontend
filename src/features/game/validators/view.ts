import { isId, isRecord, isText } from "@/lib/validation";
import { getDifficulty } from "../difficulty";
import type {
  GameQuestion,
  GameResultAnswer,
  GameReview,
  GameView,
  PlayerAttempt,
} from "../types";

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isDate = (value: unknown): value is string =>
  isText(value) && Number.isFinite(Date.parse(value));
const isNullableText = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

function isPlayerAttempt(value: unknown): value is PlayerAttempt {
  return (
    isRecord(value) &&
    isId(value.id) &&
    isId(value.quizId) &&
    // Java LocalDateTime text; the browser does not read these dates.
    isText(value.startedAt) &&
    (value.finishedAt === null || isText(value.finishedAt)) &&
    (value.status === "IN_PROGRESS" || value.status === "FINISHED")
  );
}

export function parsePlayerAttempt(value: unknown): PlayerAttempt {
  if (!isPlayerAttempt(value)) throw new Error("Unexpected attempt response");
  return value;
}

function isQuestion(value: unknown): value is GameQuestion {
  return (
    isRecord(value) &&
    isId(value.id) &&
    isText(value.text) &&
    isCount(value.index) &&
    Array.isArray(value.options) &&
    value.options.length >= 2 &&
    value.options.every(
      (option: unknown) =>
        isRecord(option) &&
        isId(option.id) &&
        isText(option.text) &&
        option.questionId === value.id,
    )
  );
}

function isReview(value: unknown): value is GameReview {
  return (
    isRecord(value) &&
    isId(value.answerId) &&
    typeof value.correct === "boolean" &&
    isNumber(value.pointsEarned) &&
    Array.isArray(value.correctOptionIds) &&
    value.correctOptionIds.every(isId) &&
    isNullableText(value.explanation)
  );
}

function isResult(value: unknown): value is GameResultAnswer {
  return (
    isRecord(value) &&
    isId(value.questionId) &&
    isText(value.questionText) &&
    isNullableText(value.answerText) &&
    (value.outcome === "correct" ||
      value.outcome === "wrong" ||
      value.outcome === "skipped")
  );
}

function isGameView(value: unknown): value is GameView {
  if (
    !isRecord(value) ||
    !isPlayerAttempt(value.attempt) ||
    !isRecord(value.category) ||
    !isId(value.category.id) ||
    !isText(value.category.name) ||
    !getDifficulty(value.difficulty) ||
    !isText(value.title) ||
    !isCount(value.total) ||
    value.total < 1 ||
    !isCount(value.answered) ||
    value.answered > value.total ||
    !isNumber(value.score) ||
    !isRecord(value.timer) ||
    !isDate(value.timer.deadline) ||
    !isDate(value.timer.serverNow)
  )
    return false;

  switch (value.phase) {
    case "question":
      return isQuestion(value.question) && value.question.index < value.total;
    case "feedback":
      return (
        isQuestion(value.question) &&
        value.question.index < value.total &&
        isReview(value.review)
      );
    case "ready-to-finish":
    case "timed-out":
      return true;
    case "finished": {
      const summary = value.summary;
      return (
        isNullableText(value.nickname) &&
        Array.isArray(value.results) &&
        value.results.every(isResult) &&
        isRecord(summary) &&
        isCount(summary.correct) &&
        isCount(summary.answered) &&
        isCount(summary.total) &&
        summary.total > 0 &&
        isNumber(summary.pointsEarned) &&
        isNumber(summary.maxPoints) &&
        isNumber(summary.elapsedSeconds) &&
        isNumber(summary.durationSeconds) &&
        (summary.totalScore === null || isNumber(summary.totalScore))
      );
    }
    default:
      return false;
  }
}

export function parseGameView(value: unknown): GameView {
  if (!isGameView(value)) throw new Error("Unexpected game response");
  return value;
}
