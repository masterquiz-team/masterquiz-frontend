import { describe, expect, it } from "vitest";
import { formatNumber } from "./format";

describe("formatNumber", () => {
  it("groups thousands with a dot like the profile and leaderboard designs", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(8920)).toBe("8.920");
    expect(formatNumber(2440)).toBe("2.440");
    expect(formatNumber(1234567)).toBe("1.234.567");
  });

  it("rounds to whole numbers", () => {
    expect(formatNumber(2439.6)).toBe("2.440");
  });
});
