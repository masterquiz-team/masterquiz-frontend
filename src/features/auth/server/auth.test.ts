import { beforeEach, expect, it, vi } from "vitest";
import { authenticate } from "./auth";
import {
  guestTokenMarker,
  GUEST_COOKIE,
  GUEST_ID_COOKIE,
  SESSION_COOKIE,
} from "@/lib/backend/token";

const { cookieGet } = vi.hoisted(() => ({ cookieGet: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
}));

const jwt = (sub: string) =>
  `header.${Buffer.from(JSON.stringify({ sub, exp: Date.now() / 1000 + 3600 })).toString("base64url")}.signature`;
const guestToken = jwt("guest_1");
const payload = {
  email: "new@example.test",
  nickname: "Newbie",
  password: "Password123",
  repeatPassword: "Password123",
};
const cookieJar = (values: Record<string, string>) =>
  cookieGet.mockImplementation((name: string) =>
    name in values ? { value: values[name] } : undefined,
  );

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.stubEnv("BACKEND_API_URL", "https://backend.test");
  cookieGet.mockReset();
  fetchMock = vi.fn(async (url: string) =>
    url.endsWith("/register")
      ? Response.json(
          { id: 7, email: payload.email, nickname: payload.nickname },
          { status: 201 },
        )
      : url.endsWith("/login")
        ? Response.json({ token: jwt(payload.email) })
        : new Response(null, { status: 404 }),
  );
  vi.stubGlobal("fetch", fetchMock);
});

const registerBody = () => {
  const call = fetchMock.mock.calls.find(([url]) =>
    String(url).endsWith("/register"),
  );
  return JSON.parse(String(call?.[1]?.body));
};

it("sends the guest ID on registration to keep the guest's progress", async () => {
  cookieJar({
    [SESSION_COOKIE]: guestToken,
    [GUEST_COOKIE]: guestTokenMarker(guestToken),
    [GUEST_ID_COOKIE]: "42",
  });
  const response = await authenticate("register", payload);
  expect(response.status).toBe(201);
  expect(registerBody()).toEqual({ ...payload, guestUserId: 42 });
});

it.each([
  ["anonymous visitor", {}],
  [
    "guest marker from a previous session",
    {
      [SESSION_COOKIE]: guestToken,
      [GUEST_COOKIE]: guestTokenMarker("previous-token"),
      [GUEST_ID_COOKIE]: "42",
    },
  ],
  [
    "invalid guest ID",
    {
      [SESSION_COOKIE]: guestToken,
      [GUEST_COOKIE]: guestTokenMarker(guestToken),
      [GUEST_ID_COOKIE]: "-1",
    },
  ],
])("sends no guest ID for an %s", async (_, cookies) => {
  cookieJar(cookies);
  await authenticate("register", payload);
  expect(registerBody()).toEqual(payload);
});
