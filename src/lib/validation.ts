import { ApiError, invalidContract } from "./api/errors";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function isText(
  value: unknown,
  min = 1,
  max = Infinity,
): value is string {
  return (
    typeof value === "string" &&
    !!value.trim() &&
    value.length >= min &&
    value.length <= max
  );
}

export function parseId(value: string): number {
  const id = Number(value);
  if (!/^\d+$/.test(value) || !isId(id))
    throw new ApiError(400, "A positive integer identifier is required.");
  return id;
}

export function parsePage(value: string | undefined): number {
  if (value === undefined) return 0;
  const page = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(page) || page > 2147483647)
    throw new ApiError(400, "Page must be a non-negative integer.");
  return page;
}

export function requireText(
  value: unknown,
  name: string,
  min: number,
  max: number,
): string {
  if (!isText(value, min, max))
    throw new ApiError(400, `${name} must contain ${min}–${max} characters.`);
  return value;
}

export function requireId(value: unknown, name = "id"): number {
  if (!isId(value))
    throw new ApiError(400, `${name} must be a positive integer.`);
  return value;
}

export function requireBoolean(value: unknown, name: string): boolean {
  if (typeof value !== "boolean")
    throw new ApiError(400, `${name} must be a boolean.`);
  return value;
}

export function requirePagination(
  page: number,
  size: number,
  message = "Invalid pagination.",
): void {
  if (
    !Number.isSafeInteger(page) ||
    page < 0 ||
    page > 2147483647 ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > 100
  )
    throw new ApiError(400, message);
}

export type SpringPage<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export function parseSpringPage<T>(
  value: unknown,
  parseItem: (value: unknown) => T,
): SpringPage<T> {
  if (!isRecord(value) || !Array.isArray(value.content)) invalidContract();
  const { number, size, totalElements, totalPages, first, last, empty } = value;
  if (
    typeof number !== "number" ||
    typeof size !== "number" ||
    typeof totalElements !== "number" ||
    typeof totalPages !== "number" ||
    ![number, size, totalElements, totalPages].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    ) ||
    size < 1 ||
    typeof first !== "boolean" ||
    typeof last !== "boolean" ||
    typeof empty !== "boolean"
  )
    invalidContract();
  const content = value.content.map(parseItem);
  if (content.length > size || empty !== (content.length === 0))
    invalidContract();
  return {
    content,
    number,
    size,
    totalElements,
    totalPages,
    first,
    last,
    empty,
  };
}
