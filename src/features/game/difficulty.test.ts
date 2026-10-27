import { describe, expect, it } from "vitest";
import {
  difficulties,
  getDifficulty,
  getDifficultyByApiName,
} from "./difficulty";

describe("difficulties", () => {
  it.each([
    ["easy", "EASY", 5],
    ["medium", "MEDIUM", 7],
    ["hard", "HARD", 10],
  ])(
    "supports ten questions with the %s time limit",
    (id, apiName, durationMinutes) => {
      expect(getDifficulty(id)).toMatchObject({
        id,
        apiName,
        questionCount: 10,
        durationMinutes,
        available: true,
      });
      expect(getDifficultyByApiName(apiName)).toEqual(getDifficulty(id));
    },
  );
  it("exposes all three playable difficulties", () => {
    expect(difficulties.filter((d) => d.available).map((d) => d.id)).toEqual([
      "easy",
      "medium",
      "hard",
    ]);
    expect(getDifficulty("expert")).toBeUndefined();
    expect(getDifficultyByApiName("easy")).toBeUndefined();
  });
});
