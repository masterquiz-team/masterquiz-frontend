import type { Difficulty } from "./difficulty";

// A playable quiz as shown in the quiz list. Questions never leave the server.
export type QuizSummary = {
  id: number;
  title: string;
  difficulty: Difficulty;
  questionCount: number;
};

// The random-quiz endpoint saves each generated quiz under the title we send
// ("Easy quiz", "Medium quiz", ...). Those are not curated quizzes.
const GENERATED_TITLE = /^(random )?(easy|medium|hard) quiz$/i;

export function isGeneratedQuiz(title: string) {
  return GENERATED_TITLE.test(title.trim());
}

// Seeded titles repeat the category ("Geography: easy round 1"); the screen
// already shows the category, so drop that prefix.
export function displayQuizTitle(title: string, categoryName: string) {
  const prefix = `${categoryName.trim()}:`.toLowerCase();
  const trimmed = title.trim();
  const short = trimmed.toLowerCase().startsWith(prefix)
    ? trimmed.slice(prefix.length).trim()
    : trimmed;
  return short ? short[0].toUpperCase() + short.slice(1) : trimmed;
}
