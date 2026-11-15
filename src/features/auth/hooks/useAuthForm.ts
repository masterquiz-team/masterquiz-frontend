import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError } from "@/lib/api/client";
import {
  getAuthFieldState,
  type AuthTouchedFields,
} from "../utils/field-state";
import { submitAuth } from "../services/auth";
import { createAuthPayload, emptyAuthValues } from "../utils/form";
import { GENERIC_AUTH_ERROR } from "../utils/messages";
import { getAuthSuccessRedirect } from "../utils/redirect";
import type {
  AuthFeedback,
  AuthFieldErrors,
  AuthFormMode,
  AuthFieldName,
} from "../types";

export function useAuthForm(mode: AuthFormMode, redirectTo = "/") {
  const router = useRouter();
  const [values, setValues] = useState(emptyAuthValues);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null);
  const [serverErrors, setServerErrors] = useState<AuthFieldErrors>({});
  const [touched, setTouched] = useState<AuthTouchedFields>({});
  const [submitted, setSubmitted] = useState(false);
  // Memoized so the focus effect below only reruns when field errors change.
  const {
    validation,
    errors: fieldErrors,
    statuses: fieldStatuses,
  } = useMemo(
    () => getAuthFieldState(mode, values, touched, submitted, serverErrors),
    [mode, values, touched, submitted, serverErrors],
  );
  // This closes the gap before React renders disabled={pending}.
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const focusErrors = useRef(false);

  // Run after errors are rendered and the pending fieldset is enabled again.
  // DOM order, rather than API object order, determines the first invalid field.
  useEffect(() => {
    if (pending || !focusErrors.current) return;
    focusErrors.current = false;
    const inputs = formRef.current?.querySelectorAll<HTMLInputElement>("input");
    const firstInvalid = Array.from(inputs ?? []).find(
      (input) => fieldErrors[input.name as AuthFieldName],
    );
    firstInvalid?.focus();
  }, [fieldErrors, pending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const payload = createAuthPayload(mode, values);

    setFeedback(null);
    const hasErrors = Object.keys(validation).length > 0;
    focusErrors.current = hasErrors;
    setSubmitted(true);
    setServerErrors({});
    if (hasErrors) return;

    submitting.current = true;
    setPending(true);
    try {
      const result = await submitAuth(mode, payload);
      if (!result.ok) {
        focusErrors.current = Boolean(result.error.fieldErrors);
        setServerErrors(result.error.fieldErrors ?? {});
        setFeedback({
          kind: "error",
          message: result.error.message,
          errors: result.error.errors,
        });
        return;
      }

      // Reset validation with the values so cleared fields don't flash red.
      setValues(emptyAuthValues);
      setTouched({});
      setSubmitted(false);
      router.replace(
        getAuthSuccessRedirect(result.signedIn ? "login" : mode, redirectTo),
      );
      // Refresh Server Components so the header reads the new cookie.
      router.refresh();
    } catch (cause) {
      setFeedback({
        kind: "error",
        message:
          cause instanceof ApiClientError ? cause.message : GENERIC_AUTH_ERROR,
      });
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  function updateField(field: AuthFieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setServerErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback(null);
  }

  return {
    formRef,
    values,
    pending,
    feedback,
    fieldErrors,
    fieldStatuses,
    blurField: (field: AuthFieldName) =>
      setTouched((current) => ({ ...current, [field]: true })),
    updateField,
    handleSubmit,
  };
}
