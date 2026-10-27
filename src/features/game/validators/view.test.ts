import { describe, expect, it } from "vitest";
import type { GameView, PlayerAttempt } from "../types";
import { parseGameView, parsePlayerAttempt } from "./view";

const attempt: PlayerAttempt = {
  id: 1,
  quizId: 2,
  startedAt: "2026-10-27T10:00:00",
  finishedAt: null,
  status: "IN_PROGRESS",
};
const base = {
  attempt,
  category: { id: 3, name: "Science" },
  difficulty: "easy" as const,
  title: "Science quiz",
  total: 10,
  answered: 0,
  score: 0,
  timer: {
    deadline: "2026-10-27T10:05:00.000Z",
    serverNow: "2026-10-27T10:00:01.000Z",
  },
};
const question = {
  id: 4,
  text: "Which option?",
  index: 0,
  options: [
    { id: 5, text: "A", questionId: 4 },
    { id: 6, text: "B", questionId: 4 },
  ],
};
const review = {
  answerId: 5,
  correct: true,
  pointsEarned: 10,
  correctOptionIds: [5],
  explanation: null,
};
const finished: GameView = {
  ...base,
  attempt: {
    ...attempt,
    status: "FINISHED",
    finishedAt: "2026-10-27T10:03:00",
  },
  phase: "finished",
  nickname: null,
  results: [
    {
      questionId: 4,
      questionText: "Which option?",
      answerText: "A",
      outcome: "correct",
    },
    { questionId: 7, questionText: "Next?", answerText: "B", outcome: "wrong" },
    {
      questionId: 8,
      questionText: "Skipped?",
      answerText: null,
      outcome: "skipped",
    },
  ],
  summary: {
    correct: 1,
    answered: 2,
    total: 10,
    pointsEarned: 10,
    maxPoints: 100,
    elapsedSeconds: 180,
    durationSeconds: 300,
    totalScore: null,
  },
};
const views: GameView[] = [
  { ...base, phase: "question", question },
  { ...base, phase: "feedback", question, review },
  { ...base, phase: "ready-to-finish", answered: 10 },
  { ...base, phase: "timed-out" },
  finished,
];

describe("parsePlayerAttempt", () => {
  it("accepts new and finished BFF attempts", () => {
    expect(parsePlayerAttempt(attempt)).toEqual(attempt);
    expect(parsePlayerAttempt(finished.attempt)).toEqual(finished.attempt);
  });

  it("keeps Java LocalDateTime text with nanoseconds", () => {
    const precise = { ...attempt, startedAt: "2026-10-27T10:00:00.123456789" };
    expect(parsePlayerAttempt(precise)).toEqual(precise);
  });

  it.each([
    { id: 1 },
    { ...attempt, id: 0 },
    { ...attempt, quizId: -1 },
    { ...attempt, id: 1.5 },
    { ...attempt, status: "STARTED" },
    { ...attempt, startedAt: "" },
    { ...attempt, finishedAt: 123 },
  ])("rejects malformed attempt %j", (value) => {
    expect(() => parsePlayerAttempt(value)).toThrow(
      "Unexpected attempt response",
    );
  });
});

describe("parseGameView", () => {
  it.each(views)("accepts phase $phase", (view) => {
    expect(parseGameView(view)).toEqual(view);
  });

  it("accepts populated nullable feedback and profile fields", () => {
    expect(
      parseGameView({
        ...base,
        phase: "feedback",
        question,
        review: { ...review, explanation: "Because…" },
      }),
    ).toMatchObject({ review: { explanation: "Because…" } });
    expect(
      parseGameView({
        ...finished,
        nickname: "Ada",
        summary: { ...finished.summary, totalScore: 123 },
      }),
    ).toMatchObject({ nickname: "Ada", summary: { totalScore: 123 } });
  });

  it.each([
    null,
    { ...base, phase: "unknown" },
    { ...base, phase: "question" },
    { ...base, phase: "question", question: { ...question, options: null } },
    { ...base, phase: "question", question: { ...question, index: 10 } },
    {
      ...base,
      phase: "question",
      question: {
        ...question,
        options: [{ id: 5, text: "A", questionId: 9 }, question.options[1]],
      },
    },
    { ...base, phase: "feedback", question },
    {
      ...base,
      phase: "feedback",
      question,
      review: { ...review, correctOptionIds: ["5"] },
    },
    {
      ...base,
      phase: "feedback",
      question,
      review: { ...review, correct: "true" },
    },
    { ...base, phase: "timed-out", attempt: { ...attempt, id: -1 } },
    { ...base, phase: "timed-out", difficulty: "EASY" },
    { ...base, phase: "timed-out", category: { id: 0, name: "Science" } },
    { ...base, phase: "ready-to-finish", score: "10" },
    { ...base, phase: "ready-to-finish", total: 0 },
    { ...base, phase: "ready-to-finish", answered: 11 },
    {
      ...base,
      phase: "timed-out",
      timer: { ...base.timer, serverNow: "invalid" },
    },
    {
      ...finished,
      results: [
        {
          questionId: 1,
          questionText: "Q",
          answerText: null,
          outcome: "pending",
        },
      ],
    },
    {
      ...finished,
      summary: { ...finished.summary, durationSeconds: undefined },
    },
    { ...finished, summary: { ...finished.summary, totalScore: Infinity } },
    { ...finished, nickname: undefined },
  ])("rejects malformed view %j", (value) => {
    expect(() => parseGameView(value)).toThrow("Unexpected game response");
  });
});
