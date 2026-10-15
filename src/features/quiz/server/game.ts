import "server-only";
import {
  ApiError,
  invalidContract,
  isId,
  isRecord,
  jsonBody,
} from "@/lib/api/server";
import { getCategory } from "@/features/categories/server/api";
import {
  parsePlayerAttempt,
  parsePlayerQuiz,
  parseRecordedAnswer,
  parseSubmittedAnswer,
} from "../contracts";
import type {
  GameView,
  PlayerOption,
  RecordedAnswer,
  SubmittedAnswer,
} from "../types";
import {
  difficultyPoints,
  easyDifficulty,
  getDifficulty,
  type Difficulty,
  type QuestionDifficulty,
} from "../difficulty";
import {
  buildGameView as buildView,
  getAnsweredQuestions as answeredQuestions,
  GameStateError,
  type GameContext,
} from "@/features/gameplay/server/game-view";
import {
  getQuizAttempt,
  getQuizzesByCategory,
  startQuizAttempt,
  quizRequest,
} from "./api";

export async function getHistory(attemptId: number) {
  return quizRequest(`/quiz-attempts/answers/${attemptId}`, (value) => {
    if (!Array.isArray(value)) invalidContract();
    const history = value.map(parseRecordedAnswer);
    if (
      history.some((a) => a.quizAttemptId !== attemptId) ||
      new Set(history.flatMap((a) => (a.id === undefined ? [] : [a.id])))
        .size !== history.filter((a) => a.id !== undefined).length
    )
      invalidContract();
    return history;
  });
}
export async function recordAnswer(attemptId: number, answerId: number) {
  return quizRequest(
    "/quiz-attempts/answers/create",
    (value) => {
      const answer = parseSubmittedAnswer(value);
      if (answer.quizAttemptId !== attemptId || answer.answerId !== answerId)
        invalidContract();
      return answer;
    },
    jsonBody("POST", { quizAttemptId: attemptId, answerId }),
  );
}
export async function finishAttempt(attemptId: number) {
  return quizRequest(
    `/quiz-attempts/${attemptId}/finish`,
    (value) => {
      const attempt = parsePlayerAttempt(value);
      if (
        attempt.id !== attemptId ||
        attempt.status !== "FINISHED" ||
        !attempt.finishedAt
      )
        invalidContract();
      return attempt;
    },
    { method: "PUT" },
  );
}

type PrivateQuestion = {
  id: number;
  text: string;
  feedback: string | null;
  difficultyName: QuestionDifficulty;
};
type PrivateQuiz = ReturnType<typeof parsePlayerQuiz> & {
  listOfQuestions: PrivateQuestion[];
};
export async function getPrivateQuiz(id: number): Promise<PrivateQuiz> {
  return quizRequest(`/quiz/${id}`, (value) => {
    const quiz = parsePlayerQuiz(value);
    if (
      quiz.id !== id ||
      quiz.listOfQuestions.length !== easyDifficulty.questionCount ||
      !isRecord(value) ||
      !Array.isArray(value.listOfQuestions)
    )
      invalidContract();
    const rawQuestions = value.listOfQuestions;
    return {
      ...quiz,
      listOfQuestions: quiz.listOfQuestions.map((q, index) => {
        const raw = rawQuestions[index];
        if (
          !isRecord(raw) ||
          typeof raw.difficultyName !== "string" ||
          !Object.hasOwn(difficultyPoints, raw.difficultyName)
        )
          invalidContract();
        return {
          ...q,
          feedback:
            isRecord(raw) &&
            typeof raw.feedback === "string" &&
            raw.feedback.trim()
              ? raw.feedback
              : null,
          difficultyName: raw.difficultyName as QuestionDifficulty,
        };
      }),
    };
  });
}
export async function getPlayerOptions(
  questionId: number,
): Promise<PlayerOption[]> {
  return quizRequest(`/answers/question/${questionId}/quiz`, (value) => {
    if (!Array.isArray(value) || value.length < 2) invalidContract();
    const options = value.map((raw) => {
      if (
        !isRecord(raw) ||
        !isId(raw.id) ||
        typeof raw.text !== "string" ||
        !raw.text.trim() ||
        raw.questionId !== questionId
      )
        invalidContract();
      // The Java player endpoint currently leaks correct. Discard it here.
      return { id: raw.id, text: raw.text, questionId };
    });
    if (new Set(options.map((a) => a.id)).size !== options.length)
      invalidContract();
    return options;
  });
}
async function getRevealedOptions(questionId: number) {
  return quizRequest(`/answers/question/${questionId}`, (value) => {
    if (!Array.isArray(value)) invalidContract();
    return value.map((raw) => {
      if (
        !isRecord(raw) ||
        !isId(raw.id) ||
        raw.questionId !== questionId ||
        typeof raw.correct !== "boolean"
      )
        invalidContract();
      return { id: raw.id, correct: raw.correct };
    });
  });
}

// Convert pure domain failures to the existing BFF error contract.
function gameState<T>(work: () => T): T {
  try {
    return work();
  } catch (error) {
    if (error instanceof GameStateError)
      throw new ApiError(error.status, error.message);
    throw error;
  }
}
export const buildGameView = (
  context: GameContext,
  history: RecordedAnswer[],
) => gameState(() => buildView(context, history));
export const getAnsweredQuestions = (
  context: GameContext,
  history: RecordedAnswer[],
) => gameState(() => answeredQuestions(context, history));

// Request-scoped only. Quiz/options have mutable CRUD endpoints and no version or
// invalidation contract; sharing a cache across requests could retain stale data
// or bypass upstream authorization. All transport requests stay no-store.
export async function loadGameContext(attemptId: number): Promise<GameContext> {
  const attempt = await getQuizAttempt(attemptId);
  const quiz = await getPrivateQuiz(attempt.quizId);
  const [category, options] = await Promise.all([
    getCategory(quiz.categoryId),
    Promise.all(quiz.listOfQuestions.map((q) => getPlayerOptions(q.id))),
  ]);
  const context = { attempt, quiz, category, options };
  getAnsweredQuestions(context, []);
  return context;
}

export async function reviewGame(
  context: GameContext,
  history: RecordedAnswer[],
  questionId: number,
  submission?: SubmittedAnswer,
): Promise<GameView> {
  const current = buildGameView(context, history);
  if (current.phase === "finished" || current.phase === "timed-out")
    return withTotalScore(current);
  const index = context.quiz.listOfQuestions.findIndex(
    (q) => q.id === questionId,
  );
  if (!getAnsweredQuestions(context, history).has(index))
    throw new ApiError(409, "Feedback is available only for a saved answer.");
  // Wrong submits currently return [] for correctAnswerIds. History also lacks
  // feedback/correct IDs: reveal options only after history proves submission.
  const options = submission?.correctAnswerIds.length
    ? undefined
    : await getRevealedOptions(questionId);
  return gameState(() =>
    buildView(context, history, { questionId, options, submission }),
  );
}

export async function withTotalScore(game: GameView): Promise<GameView> {
  if (game.phase !== "finished") return game;
  try {
    const profile = await quizRequest("/user-profile", (value) => {
      if (!isRecord(value)) invalidContract();
      // Optional fields degrade independently; no other profile data is sent
      // to the player, including email, user ID and backend entity fields.
      return {
        totalScore:
          Number.isSafeInteger(value.score) && (value.score as number) >= 0
            ? (value.score as number)
            : null,
        nickname:
          typeof value.nickname === "string" && value.nickname.trim()
            ? value.nickname.trim()
            : null,
      };
    });
    return {
      ...game,
      nickname: profile.nickname,
      summary: { ...game.summary, totalScore: profile.totalScore },
    };
  } catch {
    // Results remain available when the optional profile read fails; keep JWT.
    return game;
  }
}
export async function loadGame(
  attemptId: number,
  reviewQuestionId?: number,
): Promise<GameView> {
  const [context, history] = await Promise.all([
    loadGameContext(attemptId),
    getHistory(attemptId),
  ]);
  return reviewQuestionId === undefined
    ? withTotalScore(buildGameView(context, history))
    : reviewGame(context, history, reviewQuestionId);
}

export async function startGame(categoryId: number, difficulty: Difficulty) {
  const configuration = getDifficulty(difficulty);
  if (!configuration?.available)
    throw new ApiError(400, "This difficulty is unavailable.");
  // Preserve the existing bounded, ID-sorted search, but perform it on the server.
  for (let page = 0; page < 100; page++) {
    const quizzes = await getQuizzesByCategory(categoryId, page);
    const candidate = quizzes.content.find(
      (quiz) => quiz.listOfQuestions.length === configuration.questionCount,
    );
    if (candidate) {
      const quiz = await getPrivateQuiz(candidate.id);
      if (quiz.categoryId !== categoryId) invalidContract();
      const options = await Promise.all(
        quiz.listOfQuestions.map((q) => getPlayerOptions(q.id)),
      );
      // Validate membership and global option uniqueness before creating an attempt.
      const ids = options.flat().map((option) => option.id);
      if (new Set(ids).size !== ids.length) invalidContract();
      return startQuizAttempt(quiz.id);
    }
    if (quizzes.last || page + 1 >= quizzes.totalPages) break;
  }
  throw new ApiError(
    404,
    "No ten-question quiz is available in this category yet.",
  );
}

// Best-effort exclusion in this module's process only: not a distributed lock,
// not shared across workers, replicas, serverless instances or restarts. Saved
// history prevents sequential replays (including a lost response) from issuing
// another POST. Simultaneous requests on different processes still need backend
// uniqueness/transactional idempotency, which the current contract does not offer.
const activeMutations = new Set<number>();
export async function withAttemptMutation<T>(
  id: number,
  work: () => Promise<T>,
) {
  if (activeMutations.has(id))
    throw new ApiError(
      409,
      "A request for this attempt is already in progress. Reload saved progress.",
    );
  activeMutations.add(id);
  try {
    return await work();
  } finally {
    activeMutations.delete(id);
  }
}
