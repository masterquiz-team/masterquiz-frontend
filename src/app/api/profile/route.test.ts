import { beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/server";
import { PUT } from "./route";
const { updateAvatar, updateNickname } = vi.hoisted(() => ({
  updateAvatar: vi.fn(),
  updateNickname: vi.fn(),
}));
vi.mock("@/features/profile/server/account", () => ({
  updateAvatar,
  updateNickname,
  deleteAccount: vi.fn(),
}));
vi.mock("@/features/auth/server/session", () => ({
  clearSessionCookie: vi.fn(),
}));
beforeEach(() => {
  vi.clearAllMocks();
});
function put(body: unknown) {
  return PUT(
    new Request("http://localhost/api/profile", {
      method: "PUT",
      headers: {
        origin: "http://localhost",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
}
it.each([0, 9, "3", 2.5, null, true])(
  "rejects invalid avatar %s",
  async (avatar) => {
    expect((await put({ avatar })).status).toBe(400);
    expect(updateAvatar).not.toHaveBeenCalled();
  },
);
it.each([
  { avatar: 3, extra: true },
  { avatar: 3, nickname: "Ada" },
])("rejects mixed/extra keys", async (body) => {
  expect((await put(body)).status).toBe(400);
  expect(updateAvatar).not.toHaveBeenCalled();
});
it.each([1, 2, 3, 4, 5, 6, 7, 8])("accepts avatar %s", async (avatar) => {
  updateAvatar.mockResolvedValue({ avatar });
  expect((await put({ avatar })).status).toBe(200);
  expect(updateAvatar).toHaveBeenCalledWith(avatar);
});
it("keeps nickname trimming and validation", async () => {
  updateNickname.mockResolvedValue({ nickname: "Ada" });
  expect((await put({ nickname: " Ada " })).status).toBe(200);
  expect(updateNickname).toHaveBeenCalledWith("Ada");
  expect((await put({ nickname: "" })).status).toBe(400);
  expect((await put({ nickname: "Ada", extra: 1 })).status).toBe(400);
});

it("returns the avatar error through the BFF response", async () => {
  const message = "Couldn't save your avatar. Please try again later.";
  updateAvatar.mockRejectedValue(new ApiError(400, message));
  const response = await put({ avatar: 3 });
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ message });
});
