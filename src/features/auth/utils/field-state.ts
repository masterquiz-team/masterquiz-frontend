import type {
  AuthFieldErrors,
  AuthFieldName,
  AuthFormMode,
  AuthFormValues,
} from "../types";
import type { FieldStatus } from "@/components/ui/TextField";
import { createAuthPayload } from "./form";
import { validateAuthValues } from "../validators/auth";

export type AuthTouchedFields = Partial<Record<AuthFieldName, boolean>>;

// Derive all fields together so password edits also revalidate confirmation.
export function getAuthFieldState(
  mode: AuthFormMode,
  values: AuthFormValues,
  touched: AuthTouchedFields,
  submitted: boolean,
  serverErrors: AuthFieldErrors,
) {
  const validation = validateAuthValues(mode, createAuthPayload(mode, values));
  const errors: AuthFieldErrors = {};
  const statuses: Partial<Record<AuthFieldName, FieldStatus>> = {};
  const fields: AuthFieldName[] =
    mode === "login"
      ? ["email", "password"]
      : ["email", "nickname", "password", "repeatPassword"];
  for (const field of fields) {
    const error =
      serverErrors[field] ||
      (submitted || touched[field] ? validation[field] : undefined);
    if (error) errors[field] = error;
    // Only the server can confirm login credentials, so login fields never
    // turn green (the design's log in error keeps both fields neutral).
    statuses[field] = error
      ? "invalid"
      : mode === "register" &&
          (submitted || touched[field]) &&
          values[field].trim() &&
          !validation[field]
        ? "valid"
        : "idle";
  }
  return { validation, errors, statuses };
}
