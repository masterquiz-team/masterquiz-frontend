import { beforeEach, expect, it, vi } from "vitest";
import { saveNickname, removeAccount } from "./profile";
import { ApiClientError, DEFAULT_API_TIMEOUT } from "@/lib/api/client";

vi.mock("client-only", () => ({}));
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

it("saves and validates the account within 30 s", async () => {
  const account = {
    email: "ada@example.test",
    nickname: "Ada",
    score: 0,
    totalGamesPlayed: 0,
    level: 1,
    avatar: null,
    streak: 0,
  };
  const timeout = vi.spyOn(AbortSignal, "timeout");
  fetchMock.mockResolvedValue(Response.json(account));
  await expect(saveNickname("Ada")).resolves.toEqual(account);
  expect(timeout).toHaveBeenCalledWith(30_000);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/profile",
    expect.objectContaining({
      method: "PUT",
      body: '{"nickname":"Ada"}',
    }),
  );
});

it("preserves HTTP 400 as a typed field error", async () => {
  fetchMock.mockResolvedValue(
    Response.json(
      { message: "Check your username and try again." },
      { status: 400 },
    ),
  );
  const request = saveNickname("Ada");
  await expect(request).rejects.toBeInstanceOf(ApiClientError);
  await expect(request).rejects.toMatchObject({
    status: 400,
    message: "Check your username and try again.",
  });
});

it("rejects a malformed successful account with the existing fallback", async () => {
  fetchMock.mockResolvedValue(Response.json({ nickname: "Ada" }));
  await expect(saveNickname("Ada")).rejects.toMatchObject({
    status: 502,
    message: "The account could not be updated. Please try again.",
  });
});

it("deletes an account without requiring account fields in its response", async () => {
  fetchMock.mockResolvedValue(
    Response.json({ message: "Your account has been deleted." }),
  );
  const timeout = vi.spyOn(AbortSignal, "timeout");
  await expect(removeAccount()).resolves.toBeUndefined();
  expect(timeout).toHaveBeenCalledWith(DEFAULT_API_TIMEOUT);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/profile",
    expect.objectContaining({ method: "DELETE", body: "{}" }),
  );
});
