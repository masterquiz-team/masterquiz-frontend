import "server-only";
import { backendRequest, invalidContract, isRecord } from "@/lib/api/server";
import { badges, type BadgeId } from "../badges";

// GET /user-achievements returns only earned badges and carries no
// achievement type, so match them to the local catalogue by title.
const idByTitle = new Map<string, BadgeId>(
  badges.map((badge) => [badge.title.toLowerCase(), badge.id]),
);

function parseUnlocked(value: unknown): BadgeId[] {
  if (!Array.isArray(value)) invalidContract();
  const unlocked = new Set<BadgeId>();
  for (const item of value) {
    if (!isRecord(item) || typeof item.title !== "string") invalidContract();
    const id = idByTitle.get(item.title.trim().toLowerCase());
    // Unknown titles are badges this frontend cannot draw yet; skip them.
    if (id) unlocked.add(id);
  }
  return [...unlocked];
}

export function getUnlockedBadges(): Promise<BadgeId[]> {
  return backendRequest("/user-achievements", parseUnlocked);
}
