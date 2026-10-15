// BFF time limits; the Java backend currently has no timer contract.
export const difficulties = [
  {
    id: "easy",
    label: "Easy",
    questionCount: 10,
    durationMinutes: 5,
    available: true,
  },
  {
    id: "medium",
    label: "Medium",
    questionCount: 15,
    durationMinutes: 7,
    available: false,
  },
  {
    id: "hard",
    label: "Hard",
    questionCount: 20,
    durationMinutes: 10,
    available: false,
  },
] as const;
export type Difficulty = (typeof difficulties)[number]["id"];
export const easyDifficulty = difficulties[0];
export const difficultyPoints = { EASY: 10, MEDIUM: 20, HARD: 30 } as const;
export type QuestionDifficulty = keyof typeof difficultyPoints;
export function getDifficulty(value: unknown) {
  return difficulties.find((difficulty) => difficulty.id === value);
}
