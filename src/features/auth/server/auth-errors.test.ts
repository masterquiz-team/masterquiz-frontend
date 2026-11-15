import { beforeEach, expect, it, vi } from "vitest";
import { authenticate } from "./auth";
import { backendFetch } from "@/lib/backend/transport";
import { getSessionState } from "@/lib/backend/session";
import { clearSessionCookie } from "./session";

vi.mock("@/lib/backend/transport", () => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/backend/session", () => ({
  getSessionState: vi.fn(),
  readTokenSession: vi.fn(),
}));
vi.mock("@/lib/backend/token", () => ({
  getSessionToken: vi.fn(async () => "guest-token"),
  getGuestUserId: vi.fn(async () => null),
}));
vi.mock("./session", () => ({
  clearSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
}));
const payload = { email: "ada@example.com", password: "password" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionState).mockResolvedValue({
    status: "guest",
    session: {
      kind: "guest",
      nickname: "Guest",
      expiresAt: "2027-01-01T00:00:00Z",
    },
  });
});

it("uses product copy for login 401 despite Java text and preserves the guest session", async () => {
  vi.mocked(backendFetch).mockResolvedValue(
    Response.json(
      {
        message: "Java credential failure",
        errors: ["Java details"],
        fieldErrors: { email: "Check email" },
      },
      { status: 401 },
    ),
  );
  const response = await authenticate("login", payload);
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({
    message: "Incorrect email or password. Please try again.",
  });
  expect(clearSessionCookie).not.toHaveBeenCalled();
  expect(backendFetch).toHaveBeenCalledWith(
    "/login",
    expect.objectContaining({
      headers: { "Content-Type": "application/json" },
    }),
  );
});

it("preserves registration-specific API messages", async () => {
  vi.mocked(backendFetch).mockResolvedValue(
    Response.json({ message: "Email is already registered" }, { status: 409 }),
  );
  expect(await (await authenticate("register", payload)).json()).toMatchObject({
    message: "Email is already registered",
  });
});

it("uses the generic copy only when an API rejection has no message", async () => {
  vi.mocked(backendFetch).mockResolvedValue(Response.json({}, { status: 500 }));
  expect(await (await authenticate("login", payload)).json()).toMatchObject({
    message: "Something went wrong. Please try again.",
  });
});

it.each([null, { token: "invalid" }])(
  "uses generic copy for malformed success %j",
  async (body) => {
    vi.mocked(backendFetch).mockResolvedValue(Response.json(body));
    const response = await authenticate("login", payload);
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      message: "Something went wrong. Please try again.",
    });
  },
);
