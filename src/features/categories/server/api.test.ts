import { beforeEach, expect, it, vi } from "vitest";
import { findCategoryByName, getCategories } from "./api";

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

it("uses the shared page allowlist for categories", async () => {
  fetchMock.mockResolvedValue(
    Response.json({
      content: [{ id: 2, name: "Science", private: "secret" }],
      number: 0,
      size: 12,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      empty: false,
      sort: "private",
    }),
  );
  const result = await getCategories();
  expect(result.content).toEqual([{ id: 2, name: "Science" }]);
  expect(result).not.toHaveProperty("sort");
});

it("finds a home page category by name with its grid page", async () => {
  const content = Array.from({ length: 14 }, (_, index) => ({
    id: index + 1,
    name: index === 12 ? "Geography" : `Category ${index + 1}`,
  }));
  fetchMock.mockImplementation(async () =>
    Response.json({
      content,
      number: 0,
      size: 100,
      totalElements: content.length,
      totalPages: 1,
      first: true,
      last: true,
      empty: false,
    }),
  );
  await expect(findCategoryByName(" geography ")).resolves.toEqual({
    category: { id: 13, name: "Geography" },
    page: 1,
  });
  await expect(findCategoryByName("Unknown")).rejects.toMatchObject({
    status: 404,
  });
});
