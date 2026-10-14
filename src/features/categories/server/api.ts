import "server-only";

import { parseSpringPage, requirePagination } from "@/lib/validation";
import type { Category, CategoryInput, CategoryPage } from "../types";
import {
  backendRequest,
  deleteBackend,
  invalidContract,
  isId,
  isRecord,
  jsonBody,
  requireId,
  requireText,
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

export function createCategory(input: CategoryInput): Promise<Category> {
  return backendRequest(
    "/categories",
    parseCategory,
    jsonBody("POST", { name: requireText(input.name, "name", 2, 20) }),
  );
}

export function updateCategory(
  id: number,
  input: CategoryInput,
): Promise<Category> {
  // The backend currently uses the body ID, so always match it to the URL ID.
  return backendRequest(
    `/categories/${requireId(id)}`,
    parseCategory,
    jsonBody("PUT", { id, name: requireText(input.name, "name", 2, 20) }),
  );
}

export const deleteCategory = (id: number) =>
  deleteBackend(`/categories/${requireId(id)}`);
