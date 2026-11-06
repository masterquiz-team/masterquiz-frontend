"use client";

import { useId, useRef, type ReactNode } from "react";
import { useModalDialog } from "../useModalDialog";
import styles from "./ConfirmDialog.module.scss";

// Modal confirmation in the style of the game exit dialog. Cancel gets focus
// first so Enter never confirms a destructive action by accident.
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  pending = false,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pending?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const id = useId();
  useModalDialog(ref, {
    open,
    busy: pending,
    onClose: onCancel,
    initialFocus: () => cancel.current,
  });
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-body`}
    >
      <h2 id={`${id}-title`} className={styles.title}>
        {title}
      </h2>
      <div id={`${id}-body`} className={styles.body}>
        {children}
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button
          type="button"
          ref={cancel}
          className={styles.cancel}
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </button>
        {/* Confirm keeps focus while pending, so it is not disabled. */}
        <button
          type="button"
          className={styles.confirm}
          aria-disabled={pending}
          aria-busy={pending}
          onClick={() => {
            if (!pending) onConfirm();
          }}
        >
          {pending ? "Please wait…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
