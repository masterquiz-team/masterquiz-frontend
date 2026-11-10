import type { clearSavedAttempt } from "@/features/game/services/game";
import type { GameFailure, GameView } from "../types";

export type RecoveryTarget = NonNullable<ReturnType<typeof clearSavedAttempt>>;

export type GameState = {
  game: GameView | null;
  error: GameFailure | null;
  selected: number | null;
  pending: boolean;
  /** Grows after every finished request so the player can move focus. */
  transition: number;
  recoveryTarget: RecoveryTarget | null;
};

export type GameAction =
  | { type: "answer-selected"; index: number }
  | { type: "request-started" }
  | { type: "request-succeeded"; game: GameView }
  | { type: "request-failed"; error: GameFailure }
  | { type: "recovery-found"; target: RecoveryTarget };

export function initGameState({
  game,
  error,
}: {
  game: GameView | null;
  error: GameFailure | null;
}): GameState {
  return {
    game,
    error,
    selected: null,
    pending: false,
    transition: 0,
    recoveryTarget: null,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "answer-selected":
      return { ...state, selected: action.index };
    case "request-started":
      return { ...state, pending: true, error: null };
    case "request-succeeded":
      return {
        ...state,
        game: action.game,
        selected: null,
        pending: false,
        transition: state.transition + 1,
      };
    case "request-failed":
      // Keep the chosen answer so the player can retry the same submit.
      return {
        ...state,
        error: action.error,
        pending: false,
        transition: state.transition + 1,
      };
    case "recovery-found":
      return { ...state, recoveryTarget: action.target };
  }
}
