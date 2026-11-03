import { beforeEach, expect, it, vi } from "vitest";
import { updateNickname, updateAvatar } from "./account";
import {
  SESSION_COOKIE,
  GUEST_COOKIE,
  guestTokenMarker,
} from "@/lib/backend/token";

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

it("updates the avatar using the validator format and token email only", async () => {
  const fetchMock = vi.fn(async () => Response.json(profile));
  vi.stubGlobal("fetch", fetchMock);
  await expect(updateAvatar(2)).resolves.toMatchObject({ avatar: 2 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0] as unknown as [
    string,
    RequestInit,
  ];
  expect(url).toBe("https://backend.test/user-profile");
  expect(init.method).toBe("PUT");
  expect(JSON.parse(String(init.body))).toEqual({
    email,
    avatarId: "avatar-2",
  });
});
it.each([400, 403, 500, 502])(
  "uses the avatar message for upstream %s",
  async (status) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ message: "Internal details" }, { status }),
      ),
    );
    await expect(updateAvatar(3)).rejects.toMatchObject({
      status,
      message: "Couldn't save your avatar. Please try again later.",
    });
  },
);
it("rejects a successful response with a different avatar", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(profile)),
  );
  await expect(updateAvatar(3)).rejects.toMatchObject({
    status: 502,
    message: "Couldn't save your avatar. Please try again later.",
  });
});
it("rejects guests before sending an avatar update", async () => {
  const guest = `header.${Buffer.from(JSON.stringify({ sub: "guest:test", role: "GUEST", exp: Date.now() / 1000 + 3600 })).toString("base64url")}.signature`;
  cookieGet.mockImplementation((name: string) =>
    name === SESSION_COOKIE
      ? { value: guest }
      : name === GUEST_COOKIE
        ? { value: guestTokenMarker(guest) }
        : undefined,
  );
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  await expect(updateAvatar(3)).rejects.toMatchObject({ status: 403 });
  expect(fetchMock).not.toHaveBeenCalled();
});

it("keeps a valid session when Java masks an avatar failure as 401", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ message: "Internal error" }, { status: 401 }),
    )
    .mockResolvedValueOnce(Response.json({ content: [] }));
  vi.stubGlobal("fetch", fetchMock);
  await expect(updateAvatar(3)).rejects.toMatchObject({
    status: 409,
    message: "Couldn't save your avatar. Please try again later.",
  });
});

it("asks to log in again when the session behind an avatar update has ended", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ message: "Internal error" }, { status: 401 }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 401 }));
  vi.stubGlobal("fetch", fetchMock);
  await expect(updateAvatar(3)).rejects.toMatchObject({
    status: 401,
    message: "Please log in to continue.",
  });
});

it("reports a missing account on an avatar update", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ message: "x" }, { status: 404 })),
  );
  await expect(updateAvatar(3)).rejects.toMatchObject({
    status: 404,
    message: "This account no longer exists.",
  });
});

it("rejects a successful response without an avatar", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ ...profile, avatarId: null })),
  );
  await expect(updateAvatar(3)).rejects.toMatchObject({ status: 502 });
});
