import { describe, expect, it } from "vitest";
import { getLoginHref, toPageSession } from "./page-session";

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
