import { describe, expect, it } from "vitest";
import type { ProtectedPageResult } from "@/features/auth/server/protected-page";
import type { GameView } from "@/features/game/types";
import { ApiError } from "@/lib/api/server";
import {
  GUEST_PLAY_UNAVAILABLE,
  accountRequiredMessage,
} from "@/lib/api/guest-access";
import { toGameFailure } from "./game-failure";

type FailureResult = Exclude<ProtectedPageResult<GameView>, { status: "ok" }>;
const links = {
  href: "/quiz/play/1?page=0",
  loginHref: "/login?next=%2Fquiz%2Fplay%2F1%3Fpage%3D0",
};

describe("toGameFailure", () => {
  it("asks anonymous visitors to continue as guest or log in", () => {
    const result = { status: "anonymous", ...links } satisfies FailureResult;
    expect(toGameFailure(result)).toStrictEqual({
      status: 401,
      message:
        "Continue as guest or log in to open this attempt. Only its owner can resume it.",
    });
  });

  it("preserves the guest access message and code", () => {
    const result = { status: "guest", ...links } satisfies FailureResult;
    expect(toGameFailure(result)).toStrictEqual({
      status: 403,
      message: accountRequiredMessage,
      code: GUEST_PLAY_UNAVAILABLE,
    });
  });

  it("reports an unavailable session without discarding it", () => {
    const result = { status: "unavailable", ...links } satisfies FailureResult;
    expect(toGameFailure(result)).toStrictEqual({
      status: 503,
      message:
        "Your session could not be verified. Your session has been kept.",
    });
  });

  it("preserves an API error's status, message and code", () => {
    const result = {
      status: "error",
      cause: new ApiError(
        403,
        "Access denied.",
        undefined,
        "ATTEMPT_ACCESS_DENIED",
      ),
      ...links,
    } satisfies FailureResult;
    expect(toGameFailure(result)).toStrictEqual({
      status: 403,
      message: "Access denied.",
      code: "ATTEMPT_ACCESS_DENIED",
    });
  });

  it.each([undefined, ""])("omits the code key for API code %j", (code) => {
    const result = {
      status: "error",
      cause: new ApiError(404, "Attempt not found.", undefined, code),
    } satisfies FailureResult;
    const failure = toGameFailure(result);
    expect(failure).toStrictEqual({
      status: 404,
      message: "Attempt not found.",
    });
    expect(failure).not.toHaveProperty("code");
  });

  it("uses the fallback for non-API errors", () => {
    const result = {
      status: "error",
      cause: new Error("Unexpected failure"),
    } satisfies FailureResult;
    expect(toGameFailure(result)).toStrictEqual({
      status: 502,
      message: "The game could not be loaded. Please try again.",
    });
  });
});
