import "server-only";
import {
  ApiError,
  invalidContract,
  isRecord,
  jsonBody,
} from "@/lib/api/server";
import { getCategory } from "@/features/categories/server/api";
import { getUserProfile } from "@/features/auth/server/profile";
import {
  parsePlayerOptions,
  parseRevealedOptions,
  parsePlayerAttempt,
  parsePlayerQuiz,
  parseRecordedAnswer,
  parseSubmittedAnswer,
} from "../contracts";
import type { GameView, RecordedAnswer, SubmittedAnswer } from "../types";
import { getDifficulty, type Difficulty } from "../difficulty";
import {
  buildGameView as buildView,
  getAnsweredQuestions as answeredQuestions,
  GameStateError,
  type ContextOption,
  type GameContext,
} from "@/features/game/server/game-view";
import {
  attemptRequest,
  getQuizAttempt,
  startRandomQuizAttempt,
  quizRequest,
} from "./api";

const NOT_ENOUGH_QUESTIONS =
  "Not enough questions for a random quiz at this difficulty yet. Choose another difficulty or a ready-made quiz.";

export async function getHistory(attemptId: number) {
  return attemptRequest(`/quiz-attempts/answers/${attemptId}`, (value) => {
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
  return attemptRequest(
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
  return attemptRequest(
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

type PrivateQuiz = GameContext["quiz"];
export async function getPrivateQuiz(id: number): Promise<PrivateQuiz> {
  return quizRequest(`/quiz/${id}`, (value) => {
    const quiz = parsePlayerQuiz(value);
    if (
      quiz.id !== id ||
      quiz.listOfQuestions.length !==
        getDifficulty(quiz.difficulty)!.questionCount ||
      !isRecord(value) ||
      !Array.isArray(value.listOfQuestions)
    )
      invalidContract();
    const rawQuestions = value.listOfQuestions;
    return {
      ...quiz,
      // The backend list has no explicit order; sort so resume stays stable.
      listOfQuestions: quiz.listOfQuestions
        .map((q, index) => {
          const raw = rawQuestions[index];
          return {
            ...q,
            feedback:
              isRecord(raw) &&
              typeof raw.feedback === "string" &&
              raw.feedback.trim()
                ? raw.feedback
                : null,
          };
        })
        .sort((a, b) => a.id - b.id),
    };
  });
}
export async function getPlayerOptions(
  questionId: number,
): Promise<ContextOption[]> {
  return quizRequest(`/answers/question/${questionId}/quiz`, (value) =>
    parsePlayerOptions(value, questionId),
  );
}
async function getRevealedOptions(questionId: number) {
  return quizRequest(`/answers/question/${questionId}`, (value) =>
    parseRevealedOptions(value, questionId),
  );
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
  const record = getAnsweredQuestions(context, history).get(index);
  if (!record)
    throw new ApiError(409, "Feedback is available only for a saved answer.");
  // History has no correct IDs/feedback yet (null fields). Use them when the
  // backend fills them; otherwise reveal options only after history proves
  // the submission.
  submission ??= record.reveal && { ...record, ...record.reveal };
  const options = submission?.correctAnswerIds.length
    ? undefined
    : await getRevealedOptions(questionId);
  return gameState(() =>
    buildView(context, history, { questionId, options, submission }),
  );
}

export async function withTotalScore(game: GameView): Promise<GameView> {
  if (game.phase !== "finished") return game;
  const profile = await getUserProfile();
  return profile
    ? {
        ...game,
        nickname: profile.nickname,
        summary: { ...game.summary, totalScore: profile.score },
      }
    : game;
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
  const category = await getCategory(categoryId);
  if (category.id !== categoryId) invalidContract();
  try {
    const attempt = await startRandomQuizAttempt({
      // Backend requires 2–20 characters; the title is not shown to players.
      quizTitle: `${configuration.label} quiz`,
      category: category.name,
      difficulty: configuration.apiName,
    });
    const quiz = await quizRequest(`/quiz/${attempt.quizId}`, parsePlayerQuiz);
    if (
      quiz.id !== attempt.quizId ||
      quiz.categoryId !== categoryId ||
      quiz.difficulty !== difficulty
    )
      invalidContract();
    // Validate before returning the attempt so the client never saves a short quiz.
    if (quiz.listOfQuestions.length < configuration.questionCount)
      throw new ApiError(409, NOT_ENOUGH_QUESTIONS);
    return attempt;
  } catch (error) {
    // The backend answers 409 when a category/difficulty has too few questions.
    if (error instanceof ApiError && error.status === 409)
      throw new ApiError(409, NOT_ENOUGH_QUESTIONS);
    if (
      error instanceof ApiError &&
      (error.status === 400 || error.status === 404)
    )
      throw new ApiError(
        error.status,
        "A quiz could not be started for this category and difficulty yet.",
      );
    throw error;
  }
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
