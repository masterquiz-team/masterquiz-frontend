import { describe, expect, it } from "vitest";
import { ContractError } from "@/lib/api/errors";
import {
  parsePlayerQuiz,
  parsePlayerAttempt,
  parsePlayerQuizPage,
  parseStartInput,
  QuizContractError,
} from "./contracts";

const quiz = {
  id: 1,
  title: "Quiz",
  categoryId: 2,
  userId: 777,
  listOfQuestions: [
    {
      id: 3,
      text: "Question?",
      feedback: "Secret",
      correctAnswer: true,
      answerCounter: 4,
      category: { hibernateLazyInitializer: "private" },
    },
  ],
};
const attempt = {
  id: 1,
  quizId: 2,
  userId: 3,
  startedAt: "2026-10-12T15:00:00.123456789",
  finishedAt: null,
  status: "IN_PROGRESS",
};
describe("player contracts (migrated from check-quiz-contracts)", () => {
  it("uses one contract error type", () =>
    expect(QuizContractError).toBe(ContractError));
  it("discards upstream private question fields", () =>
    expect(parsePlayerQuiz(quiz)).toEqual({
      id: 1,
      title: "Quiz",
      categoryId: 2,
      listOfQuestions: [{ id: 3, text: "Question?" }],
    }));
  it.each([
    { listOfQuestions: [quiz.listOfQuestions[0], quiz.listOfQuestions[0]] },
    { id: Number.MAX_SAFE_INTEGER + 1 },
    { title: "  " },
  ])("rejects invalid quiz %s", (patch) =>
    expect(() => parsePlayerQuiz({ ...quiz, ...patch })).toThrow(ContractError),
  );
  it("discards attempt owner and preserves LocalDateTime", () =>
    expect(parsePlayerAttempt(attempt)).toEqual({
      id: 1,
      quizId: 2,
      startedAt: attempt.startedAt,
      finishedAt: null,
      status: "IN_PROGRESS",
    }));
  it.each([{ startedAt: "not-a-date" }, { status: "PAUSED" }])(
    "rejects invalid attempt %s",
    (patch) =>
      expect(() => parsePlayerAttempt({ ...attempt, ...patch })).toThrow(
        ContractError,
      ),
  );
  it("only accepts the quizId start allowlist", () => {
    expect(parseStartInput({ quizId: 1 })).toEqual({ quizId: 1 });
    expect(() => parseStartInput({ quizId: 1, difficulty: "easy" })).toThrow(
      /Only/,
    );
    expect(() => parseStartInput({ quizId: 0 })).toThrow(/Only/);
  });
  it("rejects contradictory page metadata", () =>
    expect(() =>
      parsePlayerQuizPage({
        content: [quiz],
        number: 0,
        size: 12,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
        empty: true,
      }),
    ).toThrow(ContractError));
});
