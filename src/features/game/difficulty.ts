// The backend random-quiz endpoint always picks 10 questions. Time limits are
// BFF-only; the Java backend has no timer contract.
export const difficulties = [
  {
    id: "easy",
    apiName: "EASY",
    label: "Easy",
    questionCount: 10,
    durationMinutes: 5,
    available: true,
  },
  {
    id: "medium",
    apiName: "MEDIUM",
    label: "Medium",
    questionCount: 10,
    durationMinutes: 7,
    available: true,
  },
  {
    id: "hard",
    apiName: "HARD",
    label: "Hard",
    questionCount: 10,
    durationMinutes: 10,
    available: true,
  },
] as const;
export type Difficulty = (typeof difficulties)[number]["id"];
export function getDifficulty(value: unknown) {
  return difficulties.find((difficulty) => difficulty.id === value);
}
export function getDifficultyByApiName(value: unknown) {
  return difficulties.find((difficulty) => difficulty.apiName === value);
}
