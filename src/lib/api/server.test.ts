import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  backendRequest,
  apiResponse,
  ApiError,
  invalidContract,
} from "./server";
import {
  backendFetch,
  BackendConfigurationError,
  getBackendUrl,
} from "../backend/transport";

const { cookieGet, cookieRead } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieRead: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: cookieRead }));
const token = () =>
  `header.${Buffer.from(JSON.stringify({ sub: "user@example.test", exp: Date.now() / 1000 + 3600 })).toString("base64url")}.signature`;
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  cookieGet.mockReset().mockReturnValue({ value: token() });
  cookieRead.mockReset().mockResolvedValue({ get: cookieGet });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("BACKEND_API_URL", "https://backend.test/");
});

describe("backend transport and request mapping", () => {
  it("reads credentials once and enforces bearer, no-store, timeout and redirect policy", async () => {
    fetchMock.mockResolvedValue(Response.json({ ok: true }));
    await expect(
      backendRequest("/categories", (v) => v, {
        cache: "force-cache",
        redirect: "follow",
        headers: { Authorization: "untrusted" },
      }),
    ).resolves.toEqual({ ok: true });
    expect(cookieRead).toHaveBeenCalledTimes(1);
    expect(cookieGet).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://backend.test/categories");
    expect(init).toMatchObject({ cache: "no-store", redirect: "error" });
    const headers = new Headers(init?.headers);
    expect(headers.get("accept")).toBe("application/json");
    expect(headers.get("authorization")).toMatch(/^Bearer header\./);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
  it("keeps auth transport anonymous and never reads cookies", async () => {
    fetchMock.mockResolvedValue(Response.json({}));
    await backendFetch("/login", { headers: { Authorization: "stale" } });
    expect(cookieRead).not.toHaveBeenCalled();
    expect(
      new Headers(fetchMock.mock.calls[0][1]?.headers).has("authorization"),
    ).toBe(false);
  });
  it("keeps caller cancellation", async () => {
    fetchMock.mockResolvedValue(Response.json({}));
    const signal = new AbortController().signal;
    await backendFetch("/categories", { signal });
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(signal);
  });
  it.each(["https://evil.test", "//evil.test", "/\\evil.test"])(
    "rejects non-relative paths %s",
    async (path) => {
      await expect(backendFetch(path)).rejects.toThrow(/relative/);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
  it("requires explicit production configuration, but permits the dev default", async () => {
    vi.stubEnv("BACKEND_API_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getBackendUrl()).toThrow(/BACKEND_API_URL/);
    await expect(
      backendRequest("/categories", (v) => v),
    ).rejects.toBeInstanceOf(BackendConfigurationError);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.stubEnv("NODE_ENV", "development");
    expect(getBackendUrl()).toBe("http://localhost:8080");
  });
  it("returns 401 for an absent or expired token without fetching", async () => {
    cookieGet.mockReturnValue(undefined);
    await expect(backendRequest("/categories", (v) => v)).rejects.toMatchObject(
      { status: 401 },
    );
    cookieGet.mockReturnValue({ value: "broken" });
    await expect(backendRequest("/categories", (v) => v)).rejects.toMatchObject(
      { status: 401 },
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    ["TimeoutError", 504],
    ["AbortError", 504],
    ["TypeError", 502],
  ])("maps %s to %s", async (name, status) => {
    const error = new Error("network detail");
    error.name = name;
    fetchMock.mockRejectedValue(error);
    await expect(backendRequest("/categories", (v) => v)).rejects.toMatchObject(
      { status, message: "The backend is unavailable. Please try again." },
    );
  });
  it("allowlists upstream errors and preserves 403", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { message: "Denied", errors: ["field", 3], private: "secret" },
        { status: 403 },
      ),
    );
    await expect(backendRequest("/categories", (v) => v)).rejects.toMatchObject(
      { status: 403, message: "Denied", errors: ["field"] },
    );
  });
  it("maps redirects to 502 and malformed errors to a generic message", async () => {
    fetchMock.mockResolvedValue(new Response("not-json", { status: 302 }));
    await expect(backendRequest("/categories", (v) => v)).rejects.toMatchObject(
      { status: 502, message: "The backend could not complete this request." },
    );
  });
  it("parses 204 as null and lets the parser reject invalid successful payloads", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(backendRequest("/categories", (v) => v)).resolves.toBeNull();
    fetchMock.mockResolvedValue(new Response("not-json", { status: 200 }));
    await expect(
      backendRequest("/categories", () => invalidContract()),
    ).rejects.toMatchObject({ status: 502 });
  });
});

describe("route responses", () => {
  it("supports an empty no-store 204", async () => {
    const response = await apiResponse(async () => undefined, 204);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("keeps known API error messages and logs unknown failures only on the server", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const known = await apiResponse(async () => {
      throw new ApiError(400, "Invalid", ["field"]);
    });
    expect(await known.json()).toEqual({
      message: "Invalid",
      errors: ["field"],
    });
    expect(log).not.toHaveBeenCalled();
    const error = new Error("private failure");
    const unknown = await apiResponse(
      async () => {
        throw error;
      },
      200,
      "GET /test",
    );
    expect(unknown.status).toBe(500);
    expect(await unknown.json()).toEqual({
      message: "The request could not be completed.",
    });
    expect(log).toHaveBeenCalledWith(
      "[GET /test] Unexpected request failure",
      error,
    );
  });
});
