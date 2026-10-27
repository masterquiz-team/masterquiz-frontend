import { beforeEach, expect, it, vi } from "vitest";
import { getQuizAttempt, startRandomQuizAttempt } from "./api";
import { apiResponse } from "@/lib/api/server";
import { ATTEMPT_ACCESS_DENIED } from "@/lib/api/errors";
import {
  GUEST_PLAY_UNAVAILABLE,
  accountRequiredMessage,
} from "@/features/auth/guest-access";
import { guestTokenMarker, GUEST_COOKIE } from "@/lib/backend/token";

const { cookieRead, cookieGet } = vi.hoisted(() => ({
  cookieRead: vi.fn(),
  cookieGet: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: cookieRead }));
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  const token = `header.${Buffer.from(JSON.stringify({ sub: "Guest", exp: Date.now() / 1000 + 3600 })).toString("base64url")}.signature`;
  cookieGet.mockReset().mockImplementation((name: string) => ({
    value: name === GUEST_COOKIE ? guestTokenMarker(token) : token,
  }));
  cookieRead.mockReset().mockResolvedValue({ get: cookieGet });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("BACKEND_API_URL", "https://backend.test");
});

it.each([403, 401])(
  "maps guest attempt denial %s to ATTEMPT_ACCESS_DENIED",
  async (status) => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        { message: "private detail", errors: ["secret"] },
        { status },
      ),
    );
    if (status === 401)
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));
    const response = await apiResponse(() => getQuizAttempt(7));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      code: ATTEMPT_ACCESS_DENIED,
      message: "This game belongs to another session. Start a new quiz.",
    });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(
      status === 401
        ? [
            "https://backend.test/quiz-attempts/7",
            "https://backend.test/quiz-attempts/0",
          ]
        : ["https://backend.test/quiz-attempts/7"],
    );
  },
);

it("preserves 401 when the guest JWT fails the verification probe", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 401 }));
  const response = await apiResponse(() => getQuizAttempt(7));
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({
    message: "Please log in to continue.",
  });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("preserves a user's upstream 403 without the ownership code", async () => {
  const token = `header.${Buffer.from(JSON.stringify({ sub: "user@example.test", exp: Date.now() / 1000 + 3600 })).toString("base64url")}.signature`;
  cookieGet.mockImplementation((name: string) =>
    name === GUEST_COOKIE ? undefined : { value: token },
  );
  fetchMock.mockResolvedValue(
    Response.json({ message: "private detail" }, { status: 403 }),
  );
  const response = await apiResponse(() => getQuizAttempt(7));
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({
    message:
      "The quiz service denied this request. Your session has been kept.",
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("keeps the guest recovery code for creating a new game", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 403 }));
  const response = await apiResponse(() =>
    startRandomQuizAttempt({
      quizTitle: "Quiz",
      category: "Science",
      difficulty: "EASY",
    }),
  );
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({
    code: GUEST_PLAY_UNAVAILABLE,
    message: accountRequiredMessage,
  });
});
