import { describe, expect, it } from "vitest";
import { ContractError } from "@/lib/api/errors";
import { parsePlayerQuiz, parsePlayerAttempt } from "./contracts";

const quiz = {
  id: 1,
  title: "Quiz",
  difficulty: "EASY",
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
  it("discards upstream private question fields", () =>
    expect(parsePlayerQuiz(quiz)).toEqual({
      id: 1,
      title: "Quiz",
      difficulty: "easy",
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
});
