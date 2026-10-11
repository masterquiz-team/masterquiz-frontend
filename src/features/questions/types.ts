import type { Category } from "@/features/categories/types";

// Content-management DTO. Never use these fields as player scoring logic.
export type QuestionRecord = {
  id: number;
  text: string;
  feedback: string;
  answerCounter: number;
  correctAnswer: boolean;
  category: Category;
};
export type Question = Pick<QuestionRecord, "id" | "text" | "category">;
export type QuestionInput = {
  text: string;
  feedback: string;
  categoryId: number;
};
