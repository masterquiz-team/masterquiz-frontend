// Raw correctness is only available to server-side content management.
export type AnswerRecord = {
  id: number;
  text: string;
  correct: boolean;
  questionId: number;
};
export type Answer = Omit<AnswerRecord, "correct">;
export type AnswerInput = {
  text: string;
  correct: boolean;
  questionId: number;
};
export type AnswerUpdate = Pick<AnswerInput, "text" | "correct">;
