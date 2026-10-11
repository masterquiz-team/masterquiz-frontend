import "server-only";

import type { Category, CategoryInput, CategoryPage } from "../types";
import {
  ApiError,
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
  if (!isRecord(value) || !Array.isArray(value.content)) invalidContract();
  const { number, size, totalElements, totalPages, first, last, empty } = value;
  if (
    ![number, size, totalElements, totalPages].every(
      (item) =>
        typeof item === "number" && Number.isSafeInteger(item) && item >= 0,
    ) ||
    typeof number !== "number" ||
    typeof size !== "number" ||
    typeof totalElements !== "number" ||
    typeof totalPages !== "number" ||
    typeof first !== "boolean" ||
    typeof last !== "boolean" ||
    typeof empty !== "boolean"
  )
    invalidContract();
  return {
    content: value.content.map(parseCategory),
    number,
    size,
    totalElements,
    totalPages,
    first,
    last,
    empty,
  };
}

export function getCategories(page = 0, size = 12): Promise<CategoryPage> {
  if (
    !Number.isInteger(page) ||
    page < 0 ||
    page > 2147483647 ||
    !Number.isInteger(size) ||
    size < 1 ||
    size > 100
  ) {
    throw new ApiError(400, "Invalid pagination. Size must be 1–100.");
  }
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
