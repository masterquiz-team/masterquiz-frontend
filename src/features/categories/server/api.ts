import "server-only";

import { parseSpringPage, requirePagination } from "@/lib/validation";
import type { Category, CategoryPage } from "../types";
import {
  ApiError,
  backendRequest,
  invalidContract,
  isId,
  isRecord,
  requireId,
} from "@/lib/api/server";

export function parseCategory(value: unknown): Category {
  if (!isRecord(value) || !isId(value.id) || typeof value.name !== "string")
    invalidContract();
  return { id: value.id, name: value.name };
}

function parseCategoryPage(value: unknown): CategoryPage {
  return parseSpringPage(value, parseCategory);
}

// Page size of the categories grid.
export const CATEGORIES_PAGE_SIZE = 12;

export function getCategories(
  page = 0,
  size = CATEGORIES_PAGE_SIZE,
): Promise<CategoryPage> {
  requirePagination(page, size, "Invalid pagination. Size must be 1–100.");
  return backendRequest(
    `/categories?${new URLSearchParams({ page: String(page), size: String(size), sort: "id,asc" })}`,
    parseCategoryPage,
  );
}

export function getCategory(id: number): Promise<Category> {
  return backendRequest(`/categories/${requireId(id)}`, parseCategory);
}

const ALL_CATEGORIES_PAGE_SIZE = 100;
const ALL_CATEGORIES_MAX_PAGES = 10;

// The leaderboard needs categories across pages of the browsing grid.
export async function getAllCategories(): Promise<Category[]> {
  const categories: Category[] = [];
  for (let page = 0; page < ALL_CATEGORIES_MAX_PAGES; page++) {
    const result = await getCategories(page, ALL_CATEGORIES_PAGE_SIZE);
    categories.push(...result.content);
    if (result.last) break;
  }
  return categories;
}

// Home page cards know categories by name only; ids come from the backend.
// Also returns the grid page the category sits on, for the "Back" link.
export async function findCategoryByName(
  name: string,
): Promise<{ category: Category; page: number }> {
  const target = name.trim().toLowerCase();
  const categories = await getAllCategories();
  const index = categories.findIndex(
    (category) => category.name.trim().toLowerCase() === target,
  );
  if (!target || index < 0) throw new ApiError(404, "Category not found.");
  return {
    category: categories[index],
    page: Math.floor(index / CATEGORIES_PAGE_SIZE),
  };
}
