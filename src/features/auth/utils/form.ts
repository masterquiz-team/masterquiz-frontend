import type { AuthFormMode, AuthFormValues, AuthValues } from "../types";

export const emptyAuthValues: AuthFormValues = {
  email: "",
  password: "",
  nickname: "",
  repeatPassword: "",
};

// Used by both the browser and Route Handler. Never trim passwords.
export function createAuthPayload(
  mode: AuthFormMode,
  values: AuthValues,
): AuthValues {
  return {
    email: values.email.trim(),
    password: values.password,
    ...(mode === "register"
      ? {
          nickname: values.nickname?.trim() ?? "",
          repeatPassword: values.repeatPassword ?? "",
        }
      : {}),
  };
}
