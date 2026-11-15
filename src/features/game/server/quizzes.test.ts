import { beforeEach, expect, it, vi } from "vitest";
import { listCategoryQuizzes } from "./quizzes";

const { cookieRead } = vi.hoisted(() => ({ cookieRead: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: cookieRead }));
const fetchMock = vi.fn<typeof fetch>();

const token = () =>
  `header.${Buffer.from(JSON.stringify({ sub: "user@example.test", exp: Date.now() / 1000 + 3600 })).toString("base64url")}.signature`;
const questions = (count: number) => Array.from({ length: count }, () => ({}));
const quiz = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  title: `Quiz ${id}`,
  categoryId: 2,
  difficulty: "EASY",
  listOfQuestions: questions(10),
  ...overrides,
});
const page = (content: unknown[], number = 0, last = true) => ({
  content,
  number,
  size: 100,
  totalElements: content.length,
  totalPages: 1,
  first: number === 0,
  last,
  empty: content.length === 0,
});

beforeEach(() => {
  cookieRead.mockReset().mockResolvedValue({
    get: () => ({ value: token() }),
  });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("BACKEND_API_URL", "https://backend.test");
});

it("keeps only playable quizzes of the chosen difficulty across pages", async () => {
  fetchMock
    .mockResolvedValueOnce(
      Response.json(
        page(
          [
            quiz(1),
            quiz(2, { difficulty: "HARD" }),
            quiz(3, { listOfQuestions: questions(9) }),
            quiz(4, { title: "Random easy quiz" }),
            quiz(5, { difficulty: "LEGENDARY" }),
          ],
          0,
          false,
        ),
      ),
    )
    .mockResolvedValueOnce(Response.json(page([quiz(6)], 1)));
  await expect(listCategoryQuizzes(2, "easy")).resolves.toEqual([
    { id: 1, title: "Quiz 1", difficulty: "easy", questionCount: 10 },
    { id: 6, title: "Quiz 6", difficulty: "easy", questionCount: 10 },
  ]);
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
    "https://backend.test/quiz/category/2?page=0&size=100&sort=id%2Casc",
    "https://backend.test/quiz/category/2?page=1&size=100&sort=id%2Casc",
  ]);
});

it("rejects quizzes from another category", async () => {
  fetchMock.mockResolvedValue(Response.json(page([quiz(1)])));
  await expect(listCategoryQuizzes(3, "easy")).rejects.toMatchObject({
    status: 502,
  });
});

it("rejects unknown difficulties before calling the backend", async () => {
  await expect(
    listCategoryQuizzes(2, "legendary" as never),
  ).rejects.toMatchObject({ status: 400 });
  expect(fetchMock).not.toHaveBeenCalled();
});
