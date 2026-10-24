import type { AuthFieldErrors, AuthFormMode, AuthValues } from "../types";
import { createAuthPayload } from "../utils/form";
import { isRecord } from "@/lib/validation";

// JSON has no TypeScript guarantees. Narrow its fields before normalizing them.
export function parseAuthPayload(
  mode: AuthFormMode,
  value: unknown,
): AuthValues | null {
  if (
    !isRecord(value) ||
    typeof value.email !== "string" ||
    typeof value.password !== "string"
  )
    return null;

  if (mode === "login") {
    return createAuthPayload(mode, {
      email: value.email,
      password: value.password,
    });
  }

  if (
    typeof value.nickname !== "string" ||
    typeof value.repeatPassword !== "string"
  )
    return null;

  return createAuthPayload(mode, {
    email: value.email,
    password: value.password,
    nickname: value.nickname,
    repeatPassword: value.repeatPassword,
  });
}

// The browser and Route Handler share these rules; Java also validates requests.
export function validateAuthValues(
  mode: AuthFormMode,
  values: AuthValues,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  if (!values.email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password.trim()) {
    errors.password = "Enter your password.";
  }

  if (mode === "register") {
    if (!values.nickname?.trim()) {
      errors.nickname = "Enter your username.";
    }
    if (values.password.length < 8) {
      errors.password = "Use at least 8 characters.";
    }
    if (!values.repeatPassword?.trim()) {
      errors.repeatPassword = "Repeat your password.";
    } else if (values.password !== values.repeatPassword) {
      errors.repeatPassword = "Passwords must match.";
    }
  }

  return errors;
}
