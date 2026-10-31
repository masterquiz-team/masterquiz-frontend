import { beforeEach, expect, it, vi } from "vitest";
import { clearSessionCookie, setSessionCookie } from "./session";
import { readTokenSession } from "@/lib/backend/session";
import { authJson } from "./request";
import {
  guestTokenMarker,
  GUEST_COOKIE,
  GUEST_ID_COOKIE,
  SESSION_COOKIE,
} from "@/lib/backend/token";

const jwt = (claims: unknown) =>
  `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;
const now = new Date("2026-10-14T12:00:00Z");
const claims = { sub: "user@example.test", exp: now.getTime() / 1000 + 3600 };
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(now.getTime());
});

it("sets and clears only HttpOnly server cookies", () => {
  vi.stubEnv("NODE_ENV", "production");
  const response = authJson({});
  const token = jwt(claims);
  setSessionCookie(response, token, readTokenSession(token)!);
  expect(response.cookies.get("masterquiz_session")).toMatchObject({
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  clearSessionCookie(response);
  expect(response.cookies.get("masterquiz_session")).toMatchObject({
    value: "",
    maxAge: 0,
    httpOnly: true,
    secure: true,
  });
});

it("sets a JWT-bound guest marker and clears it on user upgrade or logout", () => {
  const response = authJson({});
  const token = jwt(claims);
  setSessionCookie(response, token, readTokenSession(token, "guest")!);
  expect(response.cookies.get(GUEST_COOKIE)).toMatchObject({
    value: guestTokenMarker(token),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  setSessionCookie(response, token, readTokenSession(token)!);
  expect(response.cookies.get(GUEST_COOKIE)).toMatchObject({
    value: "",
    maxAge: 0,
  });
  setSessionCookie(response, token, readTokenSession(token, "guest")!);
  clearSessionCookie(response);
  for (const name of [SESSION_COOKIE, GUEST_COOKIE])
    expect(response.cookies.get(name)).toMatchObject({
      value: "",
      maxAge: 0,
      httpOnly: true,
    });
});

it("keeps the backend guest ID only for a guest session", () => {
  const response = authJson({});
  const token = jwt(claims);
  setSessionCookie(response, token, readTokenSession(token, "guest")!, 42);
  expect(response.cookies.get(GUEST_ID_COOKIE)).toMatchObject({
    value: "42",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  setSessionCookie(response, token, readTokenSession(token)!, 42);
  expect(response.cookies.get(GUEST_ID_COOKIE)).toMatchObject({
    value: "",
    maxAge: 0,
  });
  setSessionCookie(response, token, readTokenSession(token, "guest")!, 42);
  clearSessionCookie(response);
  expect(response.cookies.get(GUEST_ID_COOKIE)).toMatchObject({
    value: "",
    maxAge: 0,
  });
});
