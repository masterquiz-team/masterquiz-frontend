// Proposed backend contract; the Java backend has no leaderboard endpoint yet.
//   GET /leaderboard?page=0&size=10[&categoryId=1] -> Spring page of entries
//   GET /leaderboard/me[?categoryId=1]              -> the signed-in player
export type LeaderboardEntry = {
  rank: number;
  nickname: string;
  score: number;
  gamesPlayed: number;
  currentUser: boolean;
};

export type LeaderboardMe = {
  rank: number;
  score: number;
};

export type Leaderboard =
  | { status: "ok"; entries: LeaderboardEntry[]; me: LeaderboardMe | null }
  // The backend does not serve rankings yet.
  | { status: "pending" }
  | { status: "error" };
