export const levels = (
  [
    ["Curious mind", 0],
    ["Quiz Explorer", 500],
    ["Knowledge Seeker", 1200],
    ["Quick Thinker", 2500],
    ["Brain Trainer", 4500],
    ["Trivia Enthusiast", 7500],
    ["Quiz Master", 12000],
    ["Knowledge Expert", 18000],
    ["Genius", 27000],
    ["Legendary Mind", 40000],
  ] as const
).map(([title, minPoints], index) => ({
  number: index + 1,
  title,
  minPoints,
  icon: `/levels/level-${index + 1}.png`,
}));

export function levelFromScore(score: number) {
  return levels.findLast((level) => score >= level.minPoints)?.number ?? 1;
}

export function getLevelProgress(score: number, level: number) {
  const current =
    levels.find((entry) => entry.number === level) ??
    levels[levelFromScore(score) - 1];
  const next = levels[current.number] ?? null;
  return {
    current,
    next,
    remaining: next ? Math.max(0, next.minPoints - score) : 0,
    ratio: next
      ? Math.max(
          0,
          Math.min(
            1,
            (score - current.minPoints) / (next.minPoints - current.minPoints),
          ),
        )
      : 1,
  };
}
