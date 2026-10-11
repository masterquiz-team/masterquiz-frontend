import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { submitAuth } from "../services/auth";
import { createAuthPayload, emptyAuthValues } from "../utils/form";
import { getAuthSuccessRedirect } from "../utils/redirect";
import { validateAuthValues } from "../validation";
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
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  // This closes the gap before React renders disabled={pending}.
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const payload = createAuthPayload(mode, values);

    setFeedback(null);
    const validationErrors = validateAuthValues(mode, payload);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    submitting.current = true;
    setPending(true);
    try {
      const result = await submitAuth(mode, payload);
      if (!result.ok) {
        setFieldErrors(result.error.fieldErrors ?? {});
        setFeedback({
          kind: "error",
          message: result.error.message,
          errors: result.error.errors,
        });
        return;
      }

      setValues(emptyAuthValues);
      router.replace(getAuthSuccessRedirect(mode, redirectTo));
      // Refresh Server Components so the header reads the new cookie.
      router.refresh();
    } catch {
      setFeedback({
        kind: "error",
        message: "Unable to reach the service. Please try again.",
      });
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  function updateField(field: AuthFieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback(null);
  }

  return { values, pending, feedback, fieldErrors, updateField, handleSubmit };
}
