"use client";
import { useId, useRef } from "react";
import { DesignAsset } from "@/components/ui/DesignAsset";
import { Modal } from "@/components/ui/Modal";
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
  const cancel = useRef<HTMLButtonElement>(null);
  const id = useId();
  return (
    <Modal
      open={open}
      onClose={onCancel}
      initialFocus={() => cancel.current}
      // The question can change while the modal is open (for example on timeout).
      fallbackFocus={() =>
        document.querySelector<HTMLElement>(
          'main h1[tabindex], main [role="alert"][tabindex]',
        )
      }
      className={styles.dialog}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-notice`}
    >
      <button
        type="button"
        className={styles.dialogClose}
        aria-label="Close dialog"
        aria-keyshortcuts="Escape"
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
    </Modal>
  );
}
