import { beforeEach, expect, it, vi } from "vitest";
import { updateNickname } from "./account";
import { SESSION_COOKIE } from "@/lib/backend/token";

const { cookieGet } = vi.hoisted(() => ({ cookieGet: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
}));

const email = "player@example.test";
const token = `header.${Buffer.from(JSON.stringify({ sub: email, exp: Date.now() / 1000 + 3600 })).toString("base64url")}.signature`;
const profile = {
  avatarId: "AVATAR_2",
  email,
  nickname: "New Name",
  score: 40,
  totalGamesPlayed: 1,
  level: "LEVEL_1",
  streak: 0,
  lastTimePlayed: null,
};

beforeEach(() => {
  vi.stubEnv("BACKEND_API_URL", "https://backend.test");
  cookieGet.mockImplementation((name: string) =>
    name === SESSION_COOKIE ? { value: token } : undefined,
  );
});

it("updates only the nickname and leaves the avatar unchanged", async () => {
  const fetchMock = vi.fn(async () => Response.json(profile));
  vi.stubGlobal("fetch", fetchMock);
  await expect(updateNickname("New Name")).resolves.toMatchObject({
    nickname: "New Name",
    avatar: 2,
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0] as unknown as [
    string,
    RequestInit,
  ];
  expect(url).toBe("https://backend.test/user-profile");
  expect(init.method).toBe("PUT");
  expect(JSON.parse(String(init.body))).toEqual({
    email,
    nickname: "New Name",
  });
});
