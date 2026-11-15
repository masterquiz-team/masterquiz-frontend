import { describe, expect, it } from "vitest";
import type { GameView } from "../types";
import { gameReducer, initGameState, type GameState } from "./gameReducer";

const game = (phase: GameView["phase"]) => ({ phase }) as GameView;
const failure = { status: 500, message: "Server error" };

function state(overrides: Partial<GameState> = {}): GameState {
  return {
    ...initGameState({ game: game("question"), error: null }),
    ...overrides,
  };
}

describe("initGameState", () => {
  it("starts idle with the server-rendered game and error", () => {
    const initial = game("question");
    expect(initGameState({ game: initial, error: failure })).toEqual({
      game: initial,
      error: failure,
      selected: null,
      pending: false,
      transition: 0,
      recoveryTarget: null,
    });
  });
});

describe("gameReducer", () => {
  it("stores the selected answer", () => {
    expect(gameReducer(state(), { type: "answer-selected", index: 2 })).toEqual(
      state({ selected: 2 }),
    );
  });

  it("clears the previous error when a request starts", () => {
    const next = gameReducer(state({ error: failure, selected: 1 }), {
      type: "request-started",
    });
    expect(next).toEqual(state({ pending: true, selected: 1 }));
  });

  it("replaces the game and resets the selection on success", () => {
    const updated = game("feedback");
    const next = gameReducer(
      state({ pending: true, selected: 3, transition: 4 }),
      { type: "request-succeeded", game: updated },
    );
    expect(next).toEqual(state({ game: updated, transition: 5 }));
  });

  it("keeps the game and selection when a request fails", () => {
    const current = state({ pending: true, selected: 3, transition: 1 });
    const next = gameReducer(current, {
      type: "request-failed",
      error: failure,
    });
    expect(next).toEqual(
      state({ game: current.game, selected: 3, error: failure, transition: 2 }),
    );
  });

  it("remembers where to send a player whose attempt was lost", () => {
    const target = { categoryId: 7, difficulty: "hard" as const };
    expect(
      gameReducer(state(), { type: "recovery-found", target }).recoveryTarget,
    ).toBe(target);
  });
});
