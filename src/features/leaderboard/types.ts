// GET /leaderboard and /leaderboard/{categoryId} return paged rankings.
// GET /leaderboard/me returns the signed-in player's totals and category scores.
export type LeaderboardEntry = {
  rank: number;
  nickname: string;
  score: number;
  gamesPlayed: number;
  currentUser: boolean;
};

export type LeaderboardMe = {
  nickname: string;
  totalScore: number;
  totalGamesPlayed: number;
  rank: number;
  scoreByCategoryId: Record<string, number>;
  flag: boolean;
};

export type Leaderboard =
  | { status: "ok"; entries: LeaderboardEntry[]; me: LeaderboardMe | null }
  | { status: "error" };
