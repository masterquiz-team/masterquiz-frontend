// Shapes follow categories/server/api, game/server/contracts,
// profile/server/account and leaderboard/server/leaderboard parsers.
export const credentials = {
  email: "player@example.com",
  password: "Password123!",
};
export const seedUser = {
  id: 1,
  ...credentials,
  nickname: "QuizPlayer",
  score: 100,
  totalGamesPlayed: 2,
  avatarId: "avatar-1",
  level: "LEVEL_1",
  streak: 1,
  lastTimePlayed: new Date().toISOString().slice(0, 10),
};
export const categories = [
  { id: 1, name: "Geography" },
  { id: 2, name: "History" },
];
export const questions = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  text: `Geography question ${i + 1}?`,
  feedback: "Kyiv is the capital of Ukraine.",
}));
export function quiz(difficulty = "EASY", categoryId = 1) {
  return {
    id: 1,
    title: "World capitals",
    categoryId,
    difficulty,
    listOfQuestions: questions,
  };
}
export function options(questionId: number) {
  return [
    {
      id: questionId * 10 + 1,
      questionId,
      text: "Kyiv",
      points: 10,
      correct: true,
    },
    {
      id: questionId * 10 + 2,
      questionId,
      text: "London",
      points: 0,
      correct: false,
    },
  ];
}
export function springPage<T>(items: T[], page: number, size: number) {
  const content = items.slice(page * size, (page + 1) * size);
  return {
    content,
    number: page,
    size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
    first: page === 0,
    last: (page + 1) * size >= items.length,
    empty: content.length === 0,
  };
}
export const avatarPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=",
  "base64",
);
