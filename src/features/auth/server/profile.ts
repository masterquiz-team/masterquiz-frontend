import "server-only";

import { cache } from "react";
import { backendRequest, invalidContract, isRecord } from "@/lib/api/server";
import type { UserProfile } from "../types";
import { getSessionToken, isGuestToken } from "@/lib/backend/token";

// Deduplicate profile reads within a render; transport stays no-store.
export const getUserProfile = cache(async (): Promise<UserProfile | null> => {
  const token = await getSessionToken();
  if (token && (await isGuestToken(token))) return null;
  try {
    return await backendRequest("/user-profile", (value) => {
      if (!isRecord(value)) invalidContract();
      // Optional fields degrade independently. Never return email or user ID.
      return {
        nickname:
          typeof value.nickname === "string" && value.nickname.trim()
            ? value.nickname.trim()
            : null,
        score:
          Number.isSafeInteger(value.score) && (value.score as number) >= 0
            ? (value.score as number)
            : null,
      };
    });
  } catch {
    // Profile data is optional; a failed read must not clear the session.
    return null;
  }
});
