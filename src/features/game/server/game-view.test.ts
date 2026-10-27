import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RecordedAnswer } from "@/features/game/types";
import {
  buildGameView,
  GameStateError,
  getAnsweredQuestions,
  type GameContext,
} from "./game-view";

const now = Date.parse("2026-10-14T10:01:00Z");
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(now);
});

const questions = Array.from({ length: 10 }, (_, index) => ({
  id: 100 + index,
  text: `Question ${index + 1}?`,
  feedback: index === 0 ? "Fun fact" : null,
}));

function context(status: "IN_PROGRESS" | "FINISHED" = "IN_PROGRESS") {
  return {
    attempt: {
      id: 1,
      quizId: 2,
      startedAt: "2026-10-14T10:00:00",
      finishedAt: status === "FINISHED" ? "2026-10-14T10:05:00" : null,
      status,
    },
    quiz: {
      id: 2,
      title: "Quiz",
      difficulty: "easy",
      categoryId: 3,
      listOfQuestions: questions,
    },
    category: { id: 3, name: "Geography" },
    options: questions.map((q) => [
      { id: q.id * 10 + 1, text: "A", questionId: q.id, points: 10 },
      { id: q.id * 10 + 2, text: "B", questionId: q.id, points: 10 },
    ]),
  } satisfies GameContext;
}

// Option *1 is correct for every question.
const answer = (index: number, correct = true): RecordedAnswer => ({
  id: 500 + index,
  quizAttemptId: 1,
  answerId: questions[index].id * 10 + (correct ? 1 : 2),
  correctAnswer: correct,
});
const history = (count: number) =>
  Array.from({ length: count }, (_, i) => answer(i, i % 2 === 0));

describe("getAnsweredQuestions", () => {
  it("maps history to question indexes", () => {
    expect([...getAnsweredQuestions(context(), history(3)).keys()]).toEqual([
      0, 1, 2,
    ]);
  });

  it.each([
    ["a gap in the answered prefix", [answer(0), answer(2)]],
    [
      "two answers to one question",
      [answer(0), { ...answer(0, false), id: 9 }],
    ],
    ["a foreign attempt", [{ ...answer(0), quizAttemptId: 7 }]],
    ["an unknown answer", [{ ...answer(0), answerId: 1 }]],
  ])("rejects %s", (_, records) =>
    expect(() => getAnsweredQuestions(context(), records)).toThrow(
      GameStateError,
    ),
  );

  it("rejects options that belong to another question", () => {
    const broken = context();
    broken.options[1][0] = { ...broken.options[1][0], questionId: 100 };
    expect(() => getAnsweredQuestions(broken, [])).toThrow(GameStateError);
  });
});

describe("buildGameView", () => {
  it("shows the next unanswered question without private fields", () => {
    const view = buildGameView(context(), history(2));
    expect(view.phase).toBe("question");
    if (view.phase !== "question") return;
    expect(view.question.index).toBe(2);
    expect(view.question).not.toHaveProperty("feedback");
    expect(view.question.options[0]).not.toHaveProperty("correct");
    expect(view.question.options[0]).not.toHaveProperty("points");
    expect(view.score).toBe(10);
  });

  it("asks to finish after all answers are saved", () => {
    expect(buildGameView(context(), history(10)).phase).toBe("ready-to-finish");
  });

  it("summarises a finished attempt", () => {
    const view = buildGameView(context("FINISHED"), history(10));
    expect(view).toMatchObject({
      phase: "finished",
      summary: { correct: 5, answered: 10, total: 10 },
    });
  });

  it("reports unanswered questions as skipped after an early finish", () => {
    const view = buildGameView(context("FINISHED"), history(9));
    expect(view).toMatchObject({
      phase: "finished",
      summary: {
        answered: 9,
        total: 10,
        correct: 5,
        pointsEarned: 50,
        maxPoints: 100,
        elapsedSeconds: 300,
        durationSeconds: 300,
        totalScore: null,
      },
    });
    if (view.phase !== "finished") throw new Error("Expected results");
    expect(view.results[9]).toEqual({
      questionId: 109,
      questionText: "Question 10?",
      answerText: null,
      outcome: "skipped",
    });
    expect(view.results[0]).toEqual({
      questionId: 100,
      questionText: "Question 1?",
      answerText: "A",
      outcome: "correct",
    });
    expect(view.results[1]).toMatchObject({
      answerText: "B",
      outcome: "wrong",
    });
    expect(JSON.stringify(view.results)).not.toMatch(
      /Fun fact|correctOptionIds|points/,
    );
  });

  it("times out unanswered questions exactly at the deadline", () => {
    const deadline = Date.parse("2026-10-14T10:05:00Z");
    expect(buildGameView(context(), [], undefined, deadline - 1).phase).toBe(
      "question",
    );
    expect(buildGameView(context(), [], undefined, deadline)).toMatchObject({
      phase: "timed-out",
      timer: {
        deadline: "2026-10-14T10:05:00.000Z",
        serverNow: "2026-10-14T10:05:00.000Z",
      },
    });
    expect(
      buildGameView(context(), history(10), undefined, deadline).phase,
    ).toBe("ready-to-finish");
  });

  it("reveals correctness only for a saved answer", () => {
    const options = [
      { id: 1001, correct: true },
      { id: 1002, correct: false },
    ];
    const view = buildGameView(context(), [answer(0)], {
      questionId: 100,
      options,
    });
    expect(view).toMatchObject({
      phase: "feedback",
      review: {
        answerId: 1001,
        correct: true,
        correctOptionIds: [1001],
        explanation: "Fun fact",
      },
    });
    expect(() =>
      buildGameView(context(), [answer(0)], {
        questionId: 101,
        options: [
          { id: 1011, correct: true },
          { id: 1012, correct: false },
        ],
      }),
    ).toThrow(expect.objectContaining({ status: 409 }));
  });

  it("rejects revealed options that contradict history", () =>
    expect(() =>
      buildGameView(context(), [answer(0)], {
        questionId: 100,
        options: [
          { id: 1001, correct: false },
          { id: 1002, correct: true },
        ],
      }),
    ).toThrow(expect.objectContaining({ status: 502 })));
});
