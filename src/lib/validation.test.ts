import { describe, expect, it } from "vitest";
import { ApiError, ContractError } from "./api/errors";
import {
  isRecord,
  isId,
  isText,
  parseId,
  parsePage,
  requireId,
  requirePagination,
  parseSpringPage,
} from "./validation";

describe("shared validation", () => {
  it.each([null, [], "text", 1, undefined])("rejects non-record %s", (value) =>
    expect(isRecord(value)).toBe(false),
  );
  it("accepts records and positive safe IDs", () => {
    expect(isRecord({})).toBe(true);
    expect(isId(Number.MAX_SAFE_INTEGER)).toBe(true);
    for (const value of [
      0,
      -1,
      1.5,
      Infinity,
      "1",
      Number.MAX_SAFE_INTEGER + 1,
    ])
      expect(isId(value)).toBe(false);
  });
  it("checks text whitespace and lengths", () => {
    expect(isText(" ab ", 2, 4)).toBe(true);
    for (const value of [null, "", "  ", "a", "abcde"])
      expect(isText(value, 2, 4)).toBe(false);
    expect(isText("a")).toBe(true);
  });
  it.each(["", "-1", "1.5", "1e2", " 1", "+1", "0x10"])(
    "rejects non-decimal ID/page %s",
    (value) => {
      expect(() => parseId(value)).toThrow(ApiError);
      expect(() => parsePage(value)).toThrow(ApiError);
    },
  );
  it("checks input boundaries", () => {
    expect(parseId("001")).toBe(1);
    expect(() => parseId("0")).toThrow(ApiError);
    expect(parsePage(undefined)).toBe(0);
    expect(parsePage("2147483647")).toBe(2147483647);
    expect(() => parsePage("2147483648")).toThrow(ApiError);
    expect(requireId(1)).toBe(1);
    expect(() => requireId("1")).toThrow(ApiError);
  });
  it.each([
    [-1, 12],
    [0.5, 12],
    [2147483648, 12],
    [0, 0],
    [0, 101],
    [0, 1.5],
  ])("rejects pagination %s/%s", (page, size) =>
    expect(() => requirePagination(page, size)).toThrow(ApiError),
  );
  it("accepts pagination boundaries", () => {
    expect(() => requirePagination(0, 1)).not.toThrow();
    expect(() => requirePagination(2147483647, 100)).not.toThrow();
  });
});

const page = {
  content: [{ id: 1, secret: "private" }],
  number: 0,
  size: 12,
  totalElements: 1,
  totalPages: 1,
  first: true,
  last: true,
  empty: false,
  pageable: { private: true },
};
const parseItem = (value: unknown) => {
  if (!isRecord(value)) throw new ContractError();
  return { id: requireId(value.id) };
};
describe("Spring page parser", () => {
  it("only exposes allowlisted page and item fields", () =>
    expect(parseSpringPage(page, parseItem)).toEqual({
      content: [{ id: 1 }],
      number: 0,
      size: 12,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      empty: false,
    }));
  it.each([
    { number: -1 },
    { number: 0.5 },
    { size: 0 },
    { totalElements: Infinity },
    { totalPages: "1" },
    { first: 1 },
    { last: null },
    { empty: true },
    { content: null },
    { content: [{ id: 1 }, { id: 2 }], size: 1 },
  ])("rejects malformed metadata %s", (patch) =>
    expect(() => parseSpringPage({ ...page, ...patch }, parseItem)).toThrow(
      ContractError,
    ),
  );
  it("accepts an empty out-of-range page without inventing totals", () =>
    expect(
      parseSpringPage(
        {
          ...page,
          content: [],
          number: 4,
          totalElements: 0,
          totalPages: 0,
          empty: true,
        },
        parseItem,
      ).content,
    ).toEqual([]));
});
