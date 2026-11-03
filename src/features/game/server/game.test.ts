import { PUT } from "@/app/api/quiz-attempts/[id]/finish/route";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildGameView, type GameContext } from "./game-view";
import { loadGame, reviewGame, withCorrectAnswers } from "./game";
import type { RecordedAnswer } from "../types";
import { ApiError } from "@/lib/api/server";
import { parseGameView } from "../validators/view";

const { request, attempt, category } = vi.hoisted(() => ({
  request: vi.fn(),
  attempt: vi.fn(),
  category: vi.fn(),
}));
vi.mock("./api", () => ({
  quizRequest: request,
  attemptRequest: request,
  getQuizAttempt: attempt,
  startRandomQuizAttempt: vi.fn(),
}));
vi.mock("@/features/categories/server/api", () => ({ getCategory: category }));

const now = Date.parse("2026-10-14T10:01:00Z");
function context(status: "FINISHED" | "IN_PROGRESS" = "FINISHED"): GameContext {
  const questions = Array.from({ length: 10 }, (_, i) => ({
    id: 100 + i,
    text: `Question ${i + 1}`,
    feedback: null,
  }));
  return {
    attempt: {
      id: 1,
      quizId: 2,
      status,
      startedAt: "2026-10-14T10:00:00",
      finishedAt: status === "FINISHED" ? "2026-10-14T10:05:00" : null,
    },
    quiz: {
      id: 2,
      title: "Quiz",
      difficulty: "easy",
      categoryId: 3,
      listOfQuestions: questions,
    },
    category: { id: 3, name: "Science" },
    options: questions.map((q) => [
      { id: q.id * 10, questionId: q.id, text: "A", points: 10 },
      { id: q.id * 10 + 1, questionId: q.id, text: "B", points: 0 },
    ]),
  };
}
const history = (count: number): RecordedAnswer[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    quizAttemptId: 1,
    answerId: (100 + i) * 10,
    correctAnswer: true,
  }));
const reveal = (id: number) => [
  {
    id: id * 10,
    questionId: id,
    correct: true,
    text: "Untrusted upstream text",
  },
  { id: id * 10 + 1, questionId: id, correct: false },
];
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(now);
  request
    .mockReset()
    .mockImplementation(
      async (path: string, parse: (value: unknown) => unknown) => {
        const id = Number(path.split("/").at(-1));
        return parse(reveal(id));
      },
    );
});

describe("finished-only answer enrichment", () => {
  it("enriches every question including skipped using player text, without private fields", async () => {
    const ctx = context();
    const view = await withCorrectAnswers(buildGameView(ctx, history(1)), ctx);
    expect(request).toHaveBeenCalledTimes(10);
    expect(view).toMatchObject({
      phase: "finished",
      results: [
        expect.objectContaining({ outcome: "correct", correctAnswers: ["A"] }),
        ...Array.from({ length: 9 }, () =>
          expect.objectContaining({
            outcome: "skipped",
            answerText: null,
            correctAnswers: ["A"],
          }),
        ),
      ],
    });
    expect(JSON.stringify(view)).not.toMatch(
      /Untrusted|correctOptionIds|feedback|questionId":100,"correct/,
    );
    expect(parseGameView(view)).toEqual(view);
  });

  it("keeps all correct texts", async () => {
    request.mockImplementation(
      async (path: string, parse: (value: unknown) => unknown) =>
        parse(
          reveal(Number(path.split("/").at(-1))).map((a) => ({
            ...a,
            correct: true,
          })),
        ),
    );
    const ctx = context();
    const view = await withCorrectAnswers(buildGameView(ctx, []), ctx);
    expect(view.phase === "finished" && view.results[9].correctAnswers).toEqual(
      ["A", "B"],
    );
  });

  it.each(
    [
      [],
      [
        { id: 1000, questionId: 100, correct: true },
        { id: 1000, questionId: 100, correct: true },
      ],
      reveal(100).map((a) => ({ ...a, correct: false })),
      [{ id: 9999, questionId: 100, correct: true }, reveal(100)[1]],
      reveal(100).slice(0, 1),
      reveal(100).map((a) => ({ ...a, questionId: 999 })),
      reveal(100).map((a) => ({ ...a, correct: "true" })),
    ].map((invalid) => ({ invalid })),
  )("degrades an invalid reveal to an empty list: %j", async ({ invalid }) => {
    request.mockImplementation(
      async (path: string, parse: (value: unknown) => unknown) =>
        parse(
          path.endsWith("/100")
            ? invalid
            : reveal(Number(path.split("/").at(-1))),
        ),
    );
    const ctx = context();
    const view = await withCorrectAnswers(buildGameView(ctx, []), ctx);
    expect(view.phase === "finished" && view.results[0].correctAnswers).toEqual(
      [],
    );
    expect(view.phase === "finished" && view.results[1].correctAnswers).toEqual(
      ["A"],
    );
  });

  it("degrades request failures without losing the summary", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    request.mockRejectedValue(new Error("Network failure"));
    const ctx = context();
    const original = buildGameView(ctx, []);
    const view = await withCorrectAnswers(original, ctx);
    expect(view).toEqual(original);
  });

  it.each([401, 403])("rethrows a %i instead of degrading", async (status) => {
    request.mockRejectedValue(new ApiError(status, "Session expired"));
    const ctx = context();
    await expect(
      withCorrectAnswers(buildGameView(ctx, []), ctx),
    ).rejects.toMatchObject({ status });
  });

  it.each(["question", "feedback", "ready-to-finish", "timed-out"] as const)(
    "does not enrich %s",
    async (phase) => {
      const ctx = context("IN_PROGRESS");
      const view =
        phase === "feedback"
          ? buildGameView(
              ctx,
              history(1),
              { questionId: 100, options: reveal(100) },
              now,
            )
          : buildGameView(
              ctx,
              history(phase === "ready-to-finish" ? 10 : 0),
              undefined,
              phase === "timed-out" ? now + 300000 : now,
            );
      expect(view.phase).toBe(phase);
      expect(await withCorrectAnswers(view, ctx)).toBe(view);
      expect(request).not.toHaveBeenCalled();
      expect(JSON.stringify(view)).not.toContain("correctAnswers");
    },
  );

  it("requires FINISHED in both the view attempt and the server context", async () => {
    const ctx = context();
    const game = buildGameView(ctx, []);
    await withCorrectAnswers(game, context("IN_PROGRESS"));
    await withCorrectAnswers(
      { ...game, attempt: context("IN_PROGRESS").attempt },
      ctx,
    );
    expect(request).not.toHaveBeenCalled();
  });

  it("enriches the finished review early return using server question ids", async () => {
    const ctx = context();
    const view = await reviewGame(ctx, [], 999999);
    expect(view.phase === "finished" && view.results[9].correctAnswers).toEqual(
      ["A"],
    );
    expect(request.mock.calls.map(([path]) => path)).toEqual(
      ctx.quiz.listOfQuestions.map((q) => `/answers/question/${q.id}`),
    );
  });

  it("preserves active unanswered review guard and timed-out early return", async () => {
    const ctx = context("IN_PROGRESS");
    await expect(reviewGame(ctx, [], 100)).rejects.toMatchObject({
      status: 409,
    });
    vi.spyOn(Date, "now").mockReturnValue(now + 300000);
    expect((await reviewGame(ctx, [], 100)).phase).toBe("timed-out");
    expect(request).not.toHaveBeenCalled();
  });

  it("enriches a finished reload through loadGame", async () => {
    const ctx = context();
    attempt.mockResolvedValue(ctx.attempt);
    category.mockResolvedValue(ctx.category);
    request.mockImplementation(
      async (path: string, parse: (value: unknown) => unknown) => {
        if (path === "/quiz/2")
          return parse({ ...ctx.quiz, difficulty: "EASY" });
        if (path === "/quiz-attempts/answers/1") return parse([]);
        if (path.endsWith("/quiz")) {
          const id = Number(path.split("/").at(-2));
          return parse(ctx.options[id - 100]);
        }
        return parse(reveal(Number(path.split("/").at(-1))));
      },
    );
    const view = await loadGame(1);
    expect(view.phase === "finished" && view.results[9].correctAnswers).toEqual(
      ["A"],
    );
  });
});

it.each(["FINISHED", "IN_PROGRESS"] as const)(
  "the finish route enriches %s attempts, including an idempotent repeat",
  async (status) => {
    const ctx = context(status);
    const finished = context();
    vi.spyOn(Date, "now").mockReturnValue(now + 300000);
    attempt.mockResolvedValue(ctx.attempt);
    category.mockResolvedValue(ctx.category);
    request.mockImplementation(
      async (path: string, parse: (value: unknown) => unknown) => {
        if (path === "/quiz/2")
          return parse({ ...ctx.quiz, difficulty: "EASY" });
        if (path === "/quiz-attempts/answers/1") return parse([]);
        if (path === "/quiz-attempts/1/finish") return parse(finished.attempt);
        if (path.endsWith("/quiz"))
          return parse(ctx.options[Number(path.split("/").at(-2)) - 100]);
        return parse(reveal(Number(path.split("/").at(-1))));
      },
    );
    const response = await PUT(
      new Request("https://quiz.test/api/quiz-attempts/1/finish", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://quiz.test",
        },
        body: "{}",
      }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(response.status).toBe(200);
    const view = parseGameView(await response.json());
    expect(view.phase === "finished" && view.results[9].correctAnswers).toEqual(
      ["A"],
    );
    const paths = request.mock.calls.map(([path]) => path);
    const finishIndex = paths.indexOf("/quiz-attempts/1/finish");
    if (status === "FINISHED") expect(finishIndex).toBe(-1);
    else expect(finishIndex).toBeGreaterThan(-1);
    expect(
      paths.findIndex((path) => path === "/answers/question/100"),
    ).toBeGreaterThan(finishIndex);
  },
);
