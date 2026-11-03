import { expect, it } from "vitest";
import { AVATARS, isAvatar } from "./avatars";

it("offers the eight backend avatars", () => {
  expect(AVATARS).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
});

it.each([1, 8])("accepts avatar %s", (value) => {
  expect(isAvatar(value)).toBe(true);
});

it.each([0, 9, -1, 2.5, "3", null, undefined, true, Number.NaN])(
  "rejects %s",
  (value) => {
    expect(isAvatar(value)).toBe(false);
  },
);
