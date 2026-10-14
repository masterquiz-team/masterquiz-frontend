import { describe, expect, it } from "vitest";
import {
  getLoginHref,
  toPageSession,
} from "@/features/auth/utils/page-session";
import { getCategoryArtwork } from "@/features/categories/design-preview";
import { difficulties, getDifficulty } from "@/features/quiz/difficulty";
import { getHttpStatusMessage } from "@/lib/http-status-messages";

describe("page session", () => {
  it("builds a login link with a safe next path", () => {
    expect(getLoginHref("/quiz/play/4?page=1")).toBe(
      "/login?next=%2Fquiz%2Fplay%2F4%3Fpage%3D1",
    );
    expect(getLoginHref("//evil.example")).toBe("/login?next=%2F");
  });

  it("keeps the session state", () =>
    expect(
      toPageSession({ status: "unavailable", session: null }, "/categories"),
    ).toEqual({
      status: "unavailable",
      session: null,
      loginHref: "/login?next=%2Fcategories",
    }));
});

describe("getHttpStatusMessage", () => {
  const messages = { fallback: "Try again.", statuses: { 404: "Missing." } };
  it("uses the status message or the fallback", () => {
    expect(getHttpStatusMessage(404, messages)).toBe("Missing.");
    expect(getHttpStatusMessage(500, messages)).toBe("Try again.");
    expect(getHttpStatusMessage(undefined, messages)).toBe("Try again.");
  });
});

describe("getCategoryArtwork", () => {
  it("normalises category names", () => {
    expect(getCategoryArtwork(" ART &  Culture")?.name).toBe("Art & Culture");
    expect(getCategoryArtwork("geography")?.name).toBe("Geography");
    expect(getCategoryArtwork("Unknown")).toBeUndefined();
  });
});

describe("difficulties", () => {
  it("only Easy is playable until the backend supports more", () => {
    expect(difficulties.filter((d) => d.available).map((d) => d.id)).toEqual([
      "easy",
    ]);
    expect(getDifficulty("hard")?.questionCount).toBe(20);
    expect(getDifficulty("expert")).toBeUndefined();
  });
});
