import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  attemptKey,
  finishGame,
  getGame,
  GameRequestError,
  startNewGame,
  submitGameAnswer,
} from "./game";
import { ApiClientError, GAME_ACTION_TIMEOUT } from "@/lib/api/client";

vi.mock("client-only", () => ({}));

const fetchMock = vi.fn<typeof fetch>();
const start = { quizId: 2 };
const key = attemptKey(start);
const attempt = {
  id: 42,
  quizId: 2,
  startedAt: "2026-10-27T10:00:00",
  finishedAt: null,
  status: "IN_PROGRESS",
};
let storage: Map<string, string>;

beforeEach(() => {
  storage = new Map();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("startNewGame markers", () => {
  it("writes unknown before fetching and replaces it with the confirmed id", async () => {
    fetchMock.mockImplementation(async () => {
      expect(storage.get(key)).toBe("unknown");
      return Response.json(attempt);
    });
    await expect(startNewGame(start)).resolves.toEqual(attempt);
    expect(storage.get(key)).toBe("42");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([400, 409, 499])("removes the marker on HTTP %s", async (status) => {
    fetchMock.mockResolvedValue(
      Response.json({ message: "Rejected" }, { status }),
    );
    await expect(startNewGame(start)).rejects.toMatchObject({ status });
    expect(storage.has(key)).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([500, 502, 503])("keeps unknown on HTTP %s", async (status) => {
    fetchMock.mockResolvedValue(
      Response.json({ message: "Unavailable" }, { status }),
    );
    await expect(startNewGame(start)).rejects.toMatchObject({ status });
    expect(storage.get(key)).toBe("unknown");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps unknown if the successful response has a bad shape", async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 42 }));
    await expect(startNewGame(start)).rejects.toMatchObject({ status: 502 });
    expect(storage.get(key)).toBe("unknown");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      new TypeError("Failed to fetch"),
      "The connection was interrupted. Reload saved progress before trying again.",
    ],
    [
      new DOMException("Timed out", "TimeoutError"),
      "The request timed out. Reload saved progress before trying again.",
    ],
    [
      new DOMException("Aborted", "AbortError"),
      "The request timed out. Reload saved progress before trying again.",
    ],
  ])("keeps unknown on transport failure %s", async (cause, message) => {
    fetchMock.mockRejectedValue(cause);
    await expect(startNewGame(start)).rejects.toMatchObject({
      status: 0,
      message,
    });
    expect(storage.get(key)).toBe("unknown");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

it("keeps GameRequestError as the shared constructor", () => {
  expect(GameRequestError).toBe(ApiClientError);
});

it.each(["GUEST_PLAY_UNAVAILABLE", "ATTEMPT_ACCESS_DENIED"])(
  "preserves recovery code %s",
  async (code) => {
    fetchMock.mockResolvedValue(
      Response.json({ message: "Denied", code }, { status: 403 }),
    );
    await expect(getGame(42)).rejects.toMatchObject({ status: 403, code });
  },
);

it.each([
  [
    "start",
    () => startNewGame(start),
    "/api/quiz-attempts",
    "POST",
    '{"quizId":2}',
  ],
  [
    "get",
    () => getGame(42, 3),
    "/api/quiz-attempts/42/play?review=3",
    "GET",
    undefined,
  ],
  [
    "answer",
    () => submitGameAnswer(42, 5),
    "/api/quiz-attempts/42/answers",
    "POST",
    '{"answerId":5}',
  ],
  ["finish", () => finishGame(42), "/api/quiz-attempts/42/finish", "PUT", "{}"],
] as const)(
  "uses 45 seconds for %s",
  async (_, request, path, method, body) => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    fetchMock.mockResolvedValue(
      Response.json({ message: "Unavailable" }, { status: 503 }),
    );
    await expect(request()).rejects.toMatchObject({ status: 503 });
    expect(timeout).toHaveBeenCalledWith(GAME_ACTION_TIMEOUT);
    expect(fetchMock).toHaveBeenCalledWith(
      path,
      expect.objectContaining({ method }),
    );
    expect(fetchMock.mock.calls[0][1]?.body).toBe(body);
  },
);
