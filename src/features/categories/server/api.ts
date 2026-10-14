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
