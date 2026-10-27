import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensurePlaySession, logout, submitAuth } from "./auth";
import { clearSavedAttempts } from "@/lib/attempt-storage";
import { DEFAULT_API_TIMEOUT } from "@/lib/api/client";

vi.mock("client-only", () => ({}));
vi.mock("@/lib/attempt-storage", () => ({ clearSavedAttempts: vi.fn() }));

const fetchMock = vi.fn<typeof fetch>();
const user = { id: 1, email: "ada@example.test", nickname: "Ada" };
const userSession = {
  kind: "user",
  email: user.email,
  expiresAt: "2026-10-28T10:00:00Z",
};
const guestSession = {
  kind: "guest",
  nickname: "Guest",
  expiresAt: userSession.expiresAt,
};
const payload = { email: user.email, password: "password123" };

beforeEach(() => {
  fetchMock.mockReset();
  vi.mocked(clearSavedAttempts).mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("submitAuth", () => {
  it("validates login and clears attempts after a confirmed identity change", async () => {
    fetchMock.mockResolvedValue(Response.json({ session: userSession }));
    await expect(submitAuth("login", payload)).resolves.toEqual({
      ok: true,
      signedIn: true,
    });
    expect(clearSavedAttempts).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        body: JSON.stringify(payload),
      }),
    );
  });

  it.each([undefined, userSession])(
    "accepts registration with optional session %j",
    async (session) => {
      fetchMock.mockResolvedValue(
        Response.json({ user, session }, { status: 201 }),
      );
      await expect(
        submitAuth("register", {
          ...payload,
          nickname: "Ada",
          repeatPassword: payload.password,
        }),
      ).resolves.toEqual({ ok: true, signedIn: Boolean(session) });
      expect(clearSavedAttempts).toHaveBeenCalledTimes(1);
    },
  );

  it("returns structured HTTP errors including allowed field errors", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          message: "Check these fields",
          errors: ["Nickname is taken", 42],
          fieldErrors: {
            nickname: "Taken",
            email: "Invalid email",
            private: "Ignored",
          },
        },
        { status: 400 },
      ),
    );
    await expect(submitAuth("register", payload)).resolves.toEqual({
      ok: false,
      error: {
        message: "Check these fields",
        errors: ["Nickname is taken"],
        fieldErrors: { nickname: "Taken", email: "Invalid email" },
      },
    });
    expect(clearSavedAttempts).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the existing fallback for HTTP errors with no message", async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 500 }));
    await expect(submitAuth("login", payload)).resolves.toMatchObject({
      ok: false,
      error: {
        message: "The request could not be completed. Please try again.",
      },
    });
    expect(clearSavedAttempts).not.toHaveBeenCalled();
  });

  it.each([
    () => Response.json({ session: guestSession }),
    () => Response.json({ session: { ...userSession, expiresAt: "invalid" } }),
    () => Response.json(null),
    () => new Response("not JSON"),
    () => Response.json([], { status: 400 }),
    () => new Response("not JSON", { status: 500 }),
  ])(
    "rejects malformed login responses without clearing markers (%#)",
    async (response) => {
      fetchMock.mockResolvedValue(response());
      await expect(submitAuth("login", payload)).rejects.toThrow(
        "Unexpected authentication response",
      );
      expect(clearSavedAttempts).not.toHaveBeenCalled();
    },
  );
});

describe("ensurePlaySession", () => {
  it.each([
    [200, guestSession, 0],
    [200, userSession, 0],
    [201, guestSession, 1],
  ])("handles status %s and session %j", async (status, session, clears) => {
    fetchMock.mockResolvedValue(Response.json({ session }, { status }));
    await expect(ensurePlaySession()).resolves.toBeUndefined();
    expect(clearSavedAttempts).toHaveBeenCalledTimes(clears);
  });

  it("deduplicates in-flight guest requests and releases the promise after success", async () => {
    const pending = Promise.withResolvers<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);
    const first = ensurePlaySession();
    const second = ensurePlaySession();
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    pending.resolve(Response.json({ session: guestSession }, { status: 201 }));
    await Promise.all([first, second]);
    expect(clearSavedAttempts).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValueOnce(Response.json({ session: guestSession }));
    await ensurePlaySession();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(clearSavedAttempts).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      () => Response.json({ message: "Guest denied" }, { status: 403 }),
      "Guest denied",
    ],
    [
      () => new Response("not JSON", { status: 500 }),
      "Unable to start guest play. Please try again.",
    ],
    [
      () => Response.json({ session: {} }, { status: 201 }),
      "Unable to start guest play. Please try again.",
    ],
    [() => Response.json({ message: "Unavailable" }), "Unavailable"],
  ] as const)(
    "keeps errors and releases the in-flight request (%#)",
    async (response, message) => {
      fetchMock.mockResolvedValueOnce(response());
      await expect(ensurePlaySession()).rejects.toThrow(message);
      expect(clearSavedAttempts).not.toHaveBeenCalled();
      fetchMock.mockResolvedValueOnce(Response.json({ session: guestSession }));
      await ensurePlaySession();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );
});

describe("logout", () => {
  it("clears attempts after a successful logout", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ message: "You have been logged out." }),
    );
    await expect(logout()).resolves.toBeUndefined();
    expect(clearSavedAttempts).toHaveBeenCalledTimes(1);
  });

  it("keeps Logout failed for non-OK responses even with another body message", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ message: "Private failure" }, { status: 403 }),
    );
    await expect(logout()).rejects.toThrow("Logout failed");
    expect(clearSavedAttempts).not.toHaveBeenCalled();
  });
});

it.each([
  ["login", () => submitAuth("login", payload)],
  ["guest", () => ensurePlaySession()],
  ["logout", () => logout()],
] as const)(
  "uses the default timeout and keeps markers on transport failure: %s",
  async (_, request) => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    fetchMock.mockRejectedValue(new DOMException("Timed out", "TimeoutError"));
    await expect(request()).rejects.toMatchObject({
      status: 0,
      message: "The request timed out. Please try again.",
    });
    expect(timeout).toHaveBeenCalledWith(DEFAULT_API_TIMEOUT);
    expect(clearSavedAttempts).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  },
);
