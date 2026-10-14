// Durations are design estimates, never an authoritative deadline.
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
export function getDifficulty(value: unknown) {
  return difficulties.find((difficulty) => difficulty.id === value);
}
