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
export type GameQuestion = {
  id: number;
  text: string;
  index: number;
  options: PlayerOption[];
};
export type GameReview = {
  answerId: number;
  correct: boolean;
  correctOptionIds: number[];
  explanation: string | null;
};
type GameBase = {
  attempt: PlayerAttempt;
  category: { id: number; name: string };
  title: string;
  total: number;
  answered: number;
};
export type GameView = GameBase &
  (
    | { phase: "question"; question: GameQuestion }
    | { phase: "feedback"; question: GameQuestion; review: GameReview }
    | { phase: "ready-to-finish" }
    | {
        phase: "finished";
        summary: { correct: number; answered: number; total: number };
      }
  );
export type GamePhase<P extends GameView["phase"]> = Extract<
  GameView,
  { phase: P }
>;
