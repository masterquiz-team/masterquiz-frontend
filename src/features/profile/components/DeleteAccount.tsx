"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { removeAccount } from "../services/profile";
import styles from "./Profile.module.scss";

export function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await removeAccount();
      // The route cleared the session cookie; leave the protected page.
      router.replace("/");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The account could not be deleted. Please try again.",
      );
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="delete-account">
      <h2 id="delete-account">Delete account</h2>
      <p>This removes your account and total score. You will be logged out.</p>
      <button
        type="button"
        className={styles.dangerButton}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Delete account
      </button>
      <ConfirmDialog
        open={open}
        title="Delete your account?"
        confirmLabel="Yes, delete"
        pending={pending}
        error={error}
        onCancel={() => setOpen(false)}
        onConfirm={() => void confirm()}
      >
        This cannot be undone. Your profile and total score will be removed.
      </ConfirmDialog>
    </section>
  );
}
