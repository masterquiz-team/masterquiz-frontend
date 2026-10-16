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
  id?: number;
  quizAttemptId: number;
  answerId: number;
  correctAnswer: boolean;
};
export type SubmittedAnswer = RecordedAnswer & {
  questionId: number;
  correctAnswerIds: number[];
  feedback: string | null;
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
  pointsEarned: number;
  correctOptionIds: number[];
  explanation: string | null;
};
export type GameResultAnswer = {
  questionId: number;
  questionText: string;
  answerText: string | null;
  outcome: "correct" | "wrong" | "skipped";
};
type GameBase = {
  attempt: PlayerAttempt;
  category: { id: number; name: string };
  title: string;
  total: number;
  answered: number;
  score: number;
  timer: { deadline: string; serverNow: string };
};
export type GameView = GameBase &
  (
    | { phase: "question"; question: GameQuestion }
    | { phase: "feedback"; question: GameQuestion; review: GameReview }
    | { phase: "ready-to-finish" }
    | { phase: "timed-out" }
    | {
        phase: "finished";
        nickname: string | null;
        results: GameResultAnswer[];
        summary: {
          correct: number;
          answered: number;
          total: number;
          pointsEarned: number;
          maxPoints: number;
          elapsedSeconds: number;
          durationSeconds: number;
          totalScore: number | null;
        };
      }
  );
export type GamePhase<P extends GameView["phase"]> = Extract<
  GameView,
  { phase: P }
>;
