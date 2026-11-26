export const badges = [
  {
    id: "first-steps",
    title: "First Steps",
    profileTitle: "First steps",
    description: "Complete first quiz",
    rarity: "COMMON",
  },
  {
    id: "perfect-score",
    title: "Perfect Score",
    description: "Answer all 10 questions correctly in one quiz.",
    rarity: "RARE",
  },
  {
    id: "curious-mind",
    title: "Curious Mind",
    description: "Play quizzes in 5 different categories.",
    rarity: "COMMON",
  },
  {
    id: "brain-power",
    title: "Brain Power",
    description: "Get at least 80% of the maximum points in one quiz.",
    rarity: "RARE",
  },
  {
    id: "hard-mode-hero",
    title: "Hard Mode Hero",
    description: "Complete 5 quizzes on Hard level.",
    rarity: "EPIC",
  },
  {
    id: "quiz-veteran",
    title: "Quiz Veteran",
    description: "Complete 50 quizzes.",
    rarity: "EPIC",
    lockedIcon: "/images/achievements/badge-quiz-veteran-locked.png",
  },
  {
    id: "on-fire",
    title: "On Fire",
    description: "Complete quizzes 3 days in a row.",
    rarity: "RARE",
    lockedIcon: "/images/achievements/badge-on-fire-locked.png",
  },
  {
    id: "sharpshooter",
    title: "Sharpshooter",
    description: "Answer 5 questions correctly in a row.",
    rarity: "EPIC",
    lockedIcon: "/images/achievements/badge-sharpshooter-locked.png",
  },
] as const;

export type Badge = (typeof badges)[number];
export type BadgeId = Badge["id"];

export const badgeArtwork = (badge: Badge, unlocked: boolean) =>
  !unlocked && "lockedIcon" in badge
    ? badge.lockedIcon
    : `/images/achievements/badge-${badge.id}.svg`;

// Progress the account already exposes. Other badges have no counter in the
// API, so they show only their locked state.
export function badgeProgress(
  id: BadgeId,
  account: { totalGamesPlayed: number; streak: number },
) {
  if (id === "quiz-veteran")
    return { value: Math.min(account.totalGamesPlayed, 50), max: 50, unit: "" };
  if (id === "on-fire")
    return { value: Math.min(account.streak, 3), max: 3, unit: " days" };
  return null;
}

export const profileBadges = [
  "first-steps",
  "perfect-score",
  "hard-mode-hero",
  "curious-mind",
].map((id) => badges.find((badge) => badge.id === id)!);
