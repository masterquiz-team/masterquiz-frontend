"use client";
import { useEffect, useId, useRef } from "react";
import { DesignAsset } from "./GameplayArtwork";
import { assets } from "../../assets/play";
import styles from "./Gameplay.module.scss";

export function ExitDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog.showModal();
    cancel.current?.focus();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-notice`}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <button
        type="button"
        className={styles.dialogClose}
        aria-label="Close dialog"
        onClick={onCancel}
      >
        <DesignAsset src={assets.dialog.close} />
      </button>
      <span className={styles.dialogArtwork} aria-hidden="true">
        <DesignAsset src={assets.dialog.illustration} />
      </span>
      <h2 id={`${id}-title`}>Exit the game?</h2>
      <div className={styles.dialogBars} aria-hidden="true">
        <span />
        <span />
      </div>
      <p id={`${id}-notice`} className={styles.dialogNotice}>
        Leaving this screen keeps your attempt in progress. Saved answers can be
        resumed; an unsubmitted choice will not be saved.
      </p>
      <div className={styles.dialogActions}>
        <button
          type="button"
          ref={cancel}
          className={styles.outlineButton}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onConfirm}
        >
          Yes, exit
        </button>
      </div>
    </dialog>
  );
}
