import "server-only";

import { parseSpringPage, requirePagination } from "@/lib/validation";
import type { Category, CategoryPage } from "../types";
import {
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

export function getCategories(page = 0, size = 12): Promise<CategoryPage> {
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
