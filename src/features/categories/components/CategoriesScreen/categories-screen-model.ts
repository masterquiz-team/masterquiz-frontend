import type { Category, CategoryPage } from "../../types";

export type CategoriesQuery = Record<string, string | string[] | undefined>;

export type CategoriesScreenState =
  | { kind: "preview"; loginHref: string }
  | { kind: "error"; message: string; loginHref: string; retryHref: string }
  | {
      kind: "ready";
      data: CategoryPage;
      selected: Category | null;
      selectionError: string | null;
      page: number;
      retryHref: string;
    };

export function getCategoriesHref(page: number, category?: string | number) {
  return `/categories?${new URLSearchParams({
    page: String(page),
    ...(category !== undefined ? { category: String(category) } : {}),
  })}`;
}

export function getCategoriesReturnHref(query: CategoriesQuery) {
  const params = new URLSearchParams();
  for (const key of ["page", "category"]) {
    const value = query[key];
    if (typeof value === "string") params.set(key, value);
  }
  return params.size ? `/categories?${params}` : "/categories";
}
