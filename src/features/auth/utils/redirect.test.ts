import { expect, it } from "vitest";
import { getSafeRedirect } from "@/features/auth/utils/redirect";

it.each([
  undefined,
  null,
  1,
  "https://example.com",
  "//example.com",
  "/\\example.com",
  "/x\n",
  "/login",
  "/register?next=/categories",
  "/a/../login",
])("rejects unsafe or auth redirect %s", (value) =>
  expect(getSafeRedirect(value)).toBe("/"),
);
it.each(["/", "/categories", "/categories?page=2#card"])(
  "preserves local redirect %s",
  (value) => expect(getSafeRedirect(value)).toBe(value),
);
