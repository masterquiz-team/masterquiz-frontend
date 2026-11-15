import type { SpringPage } from "@/lib/validation";

export type Category = { id: number; name: string };
export type CategoryPage = SpringPage<Category>;
