export type PlayerQuestion = { id: number; text: string };
export type PlayerQuiz = {
  id: number;
  title: string;
  categoryId: number;
  listOfQuestions: PlayerQuestion[];
};
export type PlayerQuizPage = {
  content: PlayerQuiz[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};
export type PlayerAttempt = {
  id: number;
  quizId: number;
  startedAt: string;
  finishedAt: string | null;
  status: "IN_PROGRESS" | "FINISHED";
};

export type RecordedAnswer = {
  id: number;
  quizAttemptId: number;
  answerId: number;
  correctAnswer: boolean;
};
export type PlayerOption = { id: number; text: string; questionId: number };
export type GameView = {
  attempt: PlayerAttempt;
  category: { id: number; name: string };
  title: string;
  total: number;
  answered: number;
  phase: "question" | "feedback" | "ready-to-finish" | "finished";
  question: {
    id: number;
    text: string;
    index: number;
    options: PlayerOption[];
  } | null;
  review: {
    answerId: number;
    correct: boolean;
    correctOptionIds: number[];
    explanation: string | null;
  } | null;
  summary: { correct: number; answered: number; total: number } | null;
};
