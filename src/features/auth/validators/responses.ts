import type {
  AuthError,
  AuthFieldErrors,
  AuthFieldName,
  AuthSession,
  RegisteredUser,
} from "../types";

import { isRecord } from "@/lib/validation";

export function isAuthSession(value: unknown): value is AuthSession {
  return (
    isRecord(value) &&
    typeof value.email === "string" &&
    typeof value.expiresAt === "string"
  );
}

export function isRegisteredUser(value: unknown): value is RegisteredUser {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.email === "string" &&
    typeof value.nickname === "string"
  );
}

export function parseAuthError(value: unknown, fallback: string): AuthError {
  if (!isRecord(value)) return { message: fallback };

  const fieldErrors: AuthFieldErrors = {};
  if (isRecord(value.fieldErrors)) {
    const fields: AuthFieldName[] = [
      "email",
      "password",
      "nickname",
      "repeatPassword",
    ];
    for (const field of fields) {
      if (typeof value.fieldErrors[field] === "string") {
        fieldErrors[field] = value.fieldErrors[field];
      }
    }
  }

  return {
    message: typeof value.message === "string" ? value.message : fallback,
    errors: Array.isArray(value.errors)
      ? value.errors.filter(
          (error): error is string => typeof error === "string",
        )
      : undefined,
    fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
  };
}
