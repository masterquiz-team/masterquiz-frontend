import type { Difficulty } from "./difficulty";

export const difficultyHref = (categoryId: number, page: number) =>
  `/categories/difficulty?${new URLSearchParams({ category: String(categoryId), page: String(page) })}`;

export const quizListHref = (
  categoryId: number,
  difficulty: Difficulty,
  page: number,
) =>
  `/categories/quizzes?${new URLSearchParams({ category: String(categoryId), difficulty, page: String(page) })}`;
