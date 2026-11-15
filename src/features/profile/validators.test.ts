import { describe, expect, it } from "vitest";
import type { Account } from "./types";
import { parseAccount } from "./validators";

const account: Account = {
  email: "ada@example.test",
  nickname: "Ada",
  score: 100,
  totalGamesPlayed: 2,
  level: 1,
  avatar: 3,
  streak: 1,
};

describe("parseAccount", () => {
  it("accepts the BFF account with an avatar or null", () => {
    expect(parseAccount(account)).toEqual(account);
    expect(parseAccount({ ...account, avatar: null }).avatar).toBeNull();
  });

  it.each([
    null,
    {},
    { ...account, nickname: null },
    { ...account, email: 1 },
    { ...account, score: "100" },
    { ...account, score: NaN },
    { ...account, totalGamesPlayed: -1 },
    { ...account, level: 0 },
    { ...account, level: 11 },
    { ...account, avatar: 0 },
    { ...account, avatar: 21 },
    { ...account, streak: undefined },
  ])("rejects an invalid account: %j", (value) => {
    expect(() => parseAccount(value)).toThrow("Unexpected account response");
  });
});
