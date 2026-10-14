export type GameplayOption = { id: number; label: string };
export type AnswerFeedback = {
  optionId: number;
  outcome: "correct" | "incorrect";
};
export type GameFailure = { status: number; message: string };
