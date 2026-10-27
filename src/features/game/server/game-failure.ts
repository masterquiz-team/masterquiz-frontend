import "server-only";

import type { ProtectedPageResult } from "@/features/auth/server/protected-page";
import { ApiError } from "@/lib/api/server";
import type { GameFailure, GameView } from "@/features/game/types";
import {
  GUEST_PLAY_UNAVAILABLE,
  accountRequiredMessage,
} from "@/lib/api/guest-access";

export function toGameFailure(
  result: Exclude<ProtectedPageResult<GameView>, { status: "ok" }>,
): GameFailure {
  switch (result.status) {
    case "anonymous":
      return {
        status: 401,
        message:
          "Continue as guest or log in to open this attempt. Only its owner can resume it.",
      };
    case "guest":
      return {
        status: 403,
        message: accountRequiredMessage,
        code: GUEST_PLAY_UNAVAILABLE,
      };
    case "unavailable":
      return {
        status: 503,
        message:
          "Your session could not be verified. Your session has been kept.",
      };
    case "error":
      return result.cause instanceof ApiError
        ? {
            status: result.cause.status,
            message: result.cause.message,
            ...(result.cause.code ? { code: result.cause.code } : {}),
          }
        : {
            status: 502,
            message: "The game could not be loaded. Please try again.",
          };
  }
}
