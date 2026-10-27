import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSessionState } from "@/lib/backend/session";
import { getSessionToken } from "@/lib/backend/token";
import { backendFetch } from "@/lib/backend/transport";
import { getAvatarResponse } from "./avatar";

vi.mock("@/lib/backend/session", () => ({ getSessionState: vi.fn() }));
vi.mock("@/lib/backend/token", () => ({ getSessionToken: vi.fn() }));
vi.mock("@/lib/backend/transport", () => ({ backendFetch: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionState).mockResolvedValue({
    status: "authenticated",
    session: {
      kind: "user",
      email: "test@example.com",
      expiresAt: "2030-01-01",
    },
  });
  vi.mocked(getSessionToken).mockResolvedValue("test-token");
});

async function expectMissing(params = "n=1") {
  const response = await getAvatarResponse(new URLSearchParams(params));
  expect(response.status).toBe(404);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.text()).toBe("");
}

describe("avatar response", () => {
  it.each(["", "n=0", "n=21", "n=01", "n=-1", "n=1.5", "n=1&n=2"])(
    "rejects invalid avatar number: %s",
    async (params) => {
      await expectMissing(params);
      expect(getSessionState).not.toHaveBeenCalled();
      expect(backendFetch).not.toHaveBeenCalled();
    },
  );

  it.each([
    { status: "anonymous", session: null },
    { status: "unavailable", session: null },
    {
      status: "guest",
      session: { kind: "guest", nickname: "Guest", expiresAt: "2030-01-01" },
    },
  ] as const)("hides avatars from $status sessions", async (state) => {
    vi.mocked(getSessionState).mockResolvedValue(state);
    await expectMissing();
    expect(getSessionToken).not.toHaveBeenCalled();
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("rejects disallowed content types", async () => {
    vi.mocked(backendFetch).mockResolvedValue(
      new Response("<svg/>", { headers: { "Content-Type": "image/svg+xml" } }),
    );
    await expectMissing();
  });

  it("hides avatars when the token, the backend call or the body read fails", async () => {
    vi.mocked(getSessionToken).mockResolvedValueOnce(null);
    await expectMissing();
    expect(backendFetch).not.toHaveBeenCalled();

    vi.mocked(backendFetch).mockResolvedValueOnce(
      new Response(null, {
        status: 500,
        headers: { "Content-Type": "image/jpeg" },
      }),
    );
    await expectMissing();

    vi.mocked(backendFetch).mockRejectedValueOnce(new Error("network"));
    await expectMissing();

    const broken = new Response("x", {
      headers: { "Content-Type": "image/jpeg" },
    });
    vi.spyOn(broken, "arrayBuffer").mockRejectedValueOnce(new Error("aborted"));
    vi.mocked(backendFetch).mockResolvedValueOnce(broken);
    await expectMissing();
  });

  it("returns buffered image bytes with private caching and security headers", async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    vi.mocked(backendFetch).mockResolvedValue(
      new Response(bytes, {
        headers: { "Content-Type": "IMAGE/JPEG; test=1" },
      }),
    );
    const response = await getAvatarResponse(new URLSearchParams("n=20"));
    expect(backendFetch).toHaveBeenCalledWith(
      "/avatars/avatar-20.jpg",
      {},
      "test-token",
      "image/*",
    );
    expect(response.status).toBe(200);
    expect(Object.fromEntries(response.headers)).toEqual({
      "content-type": "image/jpeg",
      "cache-control": "private, max-age=3600",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox",
      vary: "Cookie",
    });
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });
});
