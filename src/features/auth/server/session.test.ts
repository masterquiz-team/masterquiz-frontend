import { beforeEach, expect, it, vi } from "vitest";
import {
  clearSessionCookie,
  getSessionState,
  readTokenSession,
  setSessionCookie,
} from "./session";
import { authJson } from "./request";
import {
  guestTokenMarker,
  GUEST_COOKIE,
  SESSION_COOKIE,
} from "@/lib/backend/token";

const { cookieGet, cookieRead } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieRead: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: cookieRead }));
const jwt = (claims: unknown) =>
  `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;
const now = new Date("2026-10-14T12:00:00Z");
const claims = { sub: "user@example.test", exp: now.getTime() / 1000 + 3600 };
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(now.getTime());
  cookieGet
    .mockReset()
    .mockImplementation((name: string) =>
      name === SESSION_COOKIE ? { value: jwt(claims) } : undefined,
    );
  cookieRead.mockReset().mockResolvedValue({ get: cookieGet });
  vi.stubEnv("BACKEND_API_URL", "https://backend.test");
});
it("reads session claims without claiming signature verification", () =>
  expect(readTokenSession(jwt(claims))).toEqual({
    kind: "user",
    email: claims.sub,
    expiresAt: "2026-10-14T13:00:00.000Z",
  }));
it.each([
  null,
  [],
  {},
  { sub: "", exp: claims.exp },
  { sub: 1, exp: claims.exp },
  { sub: claims.sub, exp: "tomorrow" },
  { sub: claims.sub, exp: now.getTime() / 1000 },
  { sub: claims.sub, exp: 1e300 },
])("rejects invalid or expired claims %s", (value) =>
  expect(readTokenSession(jwt(value))).toBeNull(),
);
it.each(["", "one.two", "one.%.three", "one.e30.three.extra"])(
  "rejects malformed token %s",
  (value) => expect(readTokenSession(value)).toBeNull(),
);
it("avoids verification for anonymous sessions", async () => {
  cookieGet.mockReturnValue(undefined);
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  await expect(getSessionState()).resolves.toEqual({
    status: "anonymous",
    session: null,
  });
  expect(fetch).not.toHaveBeenCalled();
});
it.each([
  [200, "authenticated"],
  [401, "anonymous"],
  [403, "unavailable"],
  [500, "unavailable"],
])(
  "verifies the session through the shared transport for %s",
  async (status, state) => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status }));
    vi.stubGlobal("fetch", fetch);
    const result = await getSessionState();
    expect(result.status).toBe(state);
    expect(cookieRead).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith(
      "https://backend.test/categories?page=0&size=1",
      expect.objectContaining({
        cache: "no-store",
        redirect: "error",
        signal: expect.any(AbortSignal),
      }),
    );
  },
);
it("preserves unavailable state on a network outage", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
  await expect(getSessionState()).resolves.toEqual({
    status: "unavailable",
    session: null,
  });
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

it.each([
  [404, "guest"],
  [200, "guest"],
  [401, "anonymous"],
  [403, "unavailable"],
  [500, "unavailable"],
])(
  "verifies guest sessions via the read-only attempt probe for %s",
  async (status, state) => {
    const token = jwt(claims);
    cookieGet.mockImplementation((name: string) => ({
      value: name === GUEST_COOKIE ? guestTokenMarker(token) : token,
    }));
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status }));
    vi.stubGlobal("fetch", fetch);
    const result = await getSessionState();
    expect(result).toEqual(
      state === "guest"
        ? {
            status: "guest",
            session: {
              kind: "guest",
              nickname: claims.sub,
              expiresAt: "2026-10-14T13:00:00.000Z",
            },
          }
        : { status: state, session: null },
    );
    expect(fetch).toHaveBeenCalledWith(
      "https://backend.test/quiz-attempts/0",
      expect.objectContaining({ cache: "no-store" }),
    );
  },
);
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
it("ignores a guest marker belonging to a previous JWT", async () => {
  const token = jwt(claims);
  cookieGet.mockImplementation((name: string) => ({
    value: name === GUEST_COOKIE ? guestTokenMarker("previous-token") : token,
  }));
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", fetch);
  await expect(getSessionState()).resolves.toMatchObject({
    status: "authenticated",
    session: { kind: "user", email: claims.sub },
  });
  expect(fetch.mock.calls[0][0]).toBe(
    "https://backend.test/categories?page=0&size=1",
  );
});
