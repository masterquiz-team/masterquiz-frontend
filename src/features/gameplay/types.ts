export type GameplayOption = { id: string; label: string };
export type AnswerFeedback = {
  optionId: string;
  outcome: "correct" | "incorrect";
};
