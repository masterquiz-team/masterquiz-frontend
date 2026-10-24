import "server-only";
import type { ProtectedPageResult } from "@/features/auth/server/protected-page";
import { getHttpStatusMessage } from "@/lib/http-status-messages";
import { ApiError } from "@/lib/api/server";

export type CategoryPageState<T> = {
  data: T | null;
  message: string | null;
  loginHref: string | null;
  retryHref: string | null;
};

// Shared error copy for the game screens that start from a category.
export function toCategoryPageState<T>(
  result: ProtectedPageResult<T>,
  { anonymous, fallback }: { anonymous: string; fallback: string },
): CategoryPageState<T> {
  switch (result.status) {
    case "ok":
      return {
        data: result.data,
        message: null,
        loginHref: null,
        retryHref: result.href,
      };
    case "anonymous":
      return {
        data: null,
        message: anonymous,
        loginHref: result.loginHref,
        retryHref: null,
      };
    case "unavailable":
      return {
        data: null,
        message:
          "Your session could not be verified. Please try again. Your session has been kept.",
        loginHref: null,
        retryHref: result.href,
      };
    case "error": {
      const status =
        result.cause instanceof ApiError ? result.cause.status : undefined;
      return {
        data: null,
        message: getHttpStatusMessage(status, {
          fallback,
          statuses: {
            400: "This category address is invalid. Please choose a category from the list.",
            404: "This category is unavailable. Please choose another category.",
            401: "Please log in again to access this category.",
            403: "Access to this category was denied. Your session has been kept.",
          },
        }),
        loginHref: status === 401 ? (result.loginHref ?? null) : null,
        retryHref: result.href ?? null,
      };
    }
  }
}
