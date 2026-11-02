import { describe, expect, it } from "vitest";
import { formatProfileNumber } from "./format";

describe("formatProfileNumber", () => {
  it("groups thousands with a dot like the profile design", () => {
    expect(formatProfileNumber(0)).toBe("0");
    expect(formatProfileNumber(999)).toBe("999");
    expect(formatProfileNumber(2440)).toBe("2.440");
    expect(formatProfileNumber(1234567)).toBe("1.234.567");
  });

  it("rounds to whole numbers", () => {
    expect(formatProfileNumber(2439.6)).toBe("2.440");
  });
});
