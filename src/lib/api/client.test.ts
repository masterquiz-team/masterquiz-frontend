import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiClientError, DEFAULT_API_TIMEOUT } from "./client";
import { isRecord } from "@/lib/validation";

vi.mock("client-only", () => ({}));

const fetchMock = vi.fn<typeof fetch>();
const options = {
  fallbackMessage: "Unexpected response",
  networkMessage: "Connection interrupted",
  timeoutMessage: "Request timed out",
  parse: (value: unknown) => {
    if (!isRecord(value) || typeof value.name !== "string")
      throw new Error("Invalid name");
    return value.name;
  },
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("apiRequest", () => {
  it("parses a successful JSON response and forwards its status", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ name: "Ada" }, { status: 201 }),
    );
    const parse = vi.fn(options.parse);
    await expect(apiRequest("/api/test", { ...options, parse })).resolves.toBe(
      "Ada",
    );
    expect(parse).toHaveBeenCalledWith({ name: "Ada" }, 201);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/test", {
      method: "GET",
      cache: "no-store",
      signal: expect.any(AbortSignal),
    });
  });

  it("uses no-store, JSON bodies and a per-call timeout signal", async () => {
    const signal = new AbortController().signal;
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
    fetchMock.mockResolvedValue(Response.json({ name: "Ada" }));
    await apiRequest("/api/test", {
      ...options,
      method: "POST",
      body: { name: "Ada" },
      timeoutMs: 45_000,
    });
    expect(timeout).toHaveBeenCalledWith(45_000);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/test", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: '{"name":"Ada"}',
      signal,
    });
  });

  it("uses the default timeout when none is supplied", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    fetchMock.mockResolvedValue(Response.json({ name: "Ada" }));
    await apiRequest("/api/test", options);
    expect(timeout).toHaveBeenCalledWith(DEFAULT_API_TIMEOUT);
  });

  it.each(["TimeoutError", "AbortError"])(
    "maps %s to a status-0 timeout without retrying",
    async (name) => {
      fetchMock.mockRejectedValue(new DOMException("Transport detail", name));
      await expect(apiRequest("/api/test", options)).rejects.toMatchObject({
        name: "ApiClientError",
        status: 0,
        message: options.timeoutMessage,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it("maps network failures to status 0 without retrying", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(apiRequest("/api/test", options)).rejects.toMatchObject({
      status: 0,
      message: options.networkMessage,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses distinct default network and timeout messages", async () => {
    const request = { parse: options.parse, fallbackMessage: "Fallback" };
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(apiRequest("/api/test", request)).rejects.toMatchObject({
      status: 0,
      message: "The connection was interrupted. Please try again.",
    });
    fetchMock.mockRejectedValueOnce(
      new DOMException("Timeout", "TimeoutError"),
    );
    await expect(apiRequest("/api/test", request)).rejects.toMatchObject({
      status: 0,
      message: "The request timed out. Please try again.",
    });
  });

  it("rejects non-JSON success even when the parser would accept anything", async () => {
    fetchMock.mockResolvedValue(new Response("not JSON"));
    const parse = vi.fn(() => undefined);
    await expect(
      apiRequest("/api/test", { ...options, parse }),
    ).rejects.toEqual(new ApiClientError(502, options.fallbackMessage));
    expect(parse).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])(
    "maps a rejected shape to a typed 502 (async parser: %s)",
    async (asyncParser) => {
      fetchMock.mockResolvedValue(Response.json({ name: 42 }));
      const parse = asyncParser
        ? async (value: unknown) => options.parse(value)
        : options.parse;
      await expect(
        apiRequest("/api/test", { ...options, parse }),
      ).rejects.toMatchObject({
        name: "ApiClientError",
        status: 502,
        message: options.fallbackMessage,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it("preserves HTTP status, message, code and the unknown error body", async () => {
    const body = {
      message: "Denied",
      code: "ATTEMPT_ACCESS_DENIED",
      fieldErrors: { nickname: "Taken" },
    };
    fetchMock.mockResolvedValue(Response.json(body, { status: 403 }));
    const parse = vi.fn(options.parse);
    await expect(
      apiRequest("/api/test", { ...options, parse }),
    ).rejects.toMatchObject({
      status: 403,
      message: "Denied",
      code: "ATTEMPT_ACCESS_DENIED",
      body,
    });
    expect(parse).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["not JSON", JSON.stringify({ message: 1, code: [] }), "null"])(
    "uses the fallback for malformed HTTP error body %s",
    async (body) => {
      fetchMock.mockResolvedValue(new Response(body, { status: 500 }));
      await expect(apiRequest("/api/test", options)).rejects.toMatchObject({
        status: 500,
        message: options.fallbackMessage,
        code: undefined,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it("recognises timeouts while reading the response body", async () => {
    const response = Response.json({ name: "Ada" });
    vi.spyOn(response, "json").mockRejectedValue(
      new DOMException("Timed out while reading", "AbortError"),
    );
    fetchMock.mockResolvedValue(response);
    await expect(apiRequest("/api/test", options)).rejects.toMatchObject({
      status: 0,
      message: options.timeoutMessage,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
