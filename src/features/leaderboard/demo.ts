import type { Leaderboard } from "./types";

// Sample rows from the Figma frame, for reviewing the layout in development
// only (/leaderboard?demo=1). Never shown in production.
const players: [string, number, number][] = [
  ["Kinga", 8920, 50],
  ["Patryk", 8450, 46],
  ["Alex", 8120, 44],
  ["You", 2440, 18],
  ["Julia", 2100, 16],
  ["Sophie", 2050, 15],
  ["Dmytro", 1900, 14],
  ["Zeynep", 1850, 12],
  ["Olivia", 1700, 11],
  ["Emma", 1500, 10],
];

export function getDemoLeaderboard(categoryId: number | null): Leaderboard {
  return {
    status: "ok",
    entries: players.map(([nickname, score, gamesPlayed], index) => ({
      rank: index + 1,
      nickname,
      score,
      gamesPlayed,
      currentUser: nickname === "You",
    })),
    me: {
      nickname: "You",
      totalScore: 2440,
      totalGamesPlayed: 18,
      rank: 4,
      scoreByCategoryId: categoryId === null ? {} : { [categoryId]: 2440 },
      flag: true,
    },
  };
}
