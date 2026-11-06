"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAvatar } from "../services/profile";
import { ApiClientError } from "@/lib/api/client";
import { AVATARS, AVATAR_SAVE_FAILED } from "../avatars";
import styles from "./Profile.module.scss";

function Thumbnail({ avatar }: { avatar: number }) {
  const [failed, setFailed] = useState(false);
  return (
    // The protected BFF image needs the browser session cookie.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={
        failed
          ? "/images/profile/avatar-placeholder.svg"
          : `/api/profile/avatar?n=${avatar}`
      }
      width={80}
      height={80}
      alt={`Avatar ${avatar}`}
      onError={() => setFailed(true)}
    />
  );
}

export function AvatarPicker({
  current,
  onSaved,
  onClose,
}: {
  current: number | null;
  onSaved: (avatar: number) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const alive = useRef(false);
  const submitting = useRef(false);
  const attempted = useRef<number | null>(null);
  const saveButton = useRef<HTMLButtonElement>(null);
  const id = useId();
  const [selected, setSelected] = useState(current);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The refresh after a failed save can show that it went through after all.
  useEffect(() => {
    if (attempted.current !== null && current === attempted.current) onClose();
  }, [current, onClose]);

  // A save in flight finishes before the dialog can close.
  const requestClose = () => {
    if (!submitting.current) onClose();
  };

  useEffect(() => {
    alive.current = true;
    const element = dialog.current;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    element?.showModal();
    const radio = element?.querySelector<HTMLInputElement>("input:checked");
    (radio ?? close.current)?.focus();
    return () => {
      alive.current = false;
      element?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  async function save() {
    if (submitting.current || selected === null || selected === current) return;
    submitting.current = true;
    attempted.current = selected;
    // Saving disables the options; keep focus on Save, which stays focusable.
    saveButton.current?.focus();
    setPending(true);
    setError(null);
    try {
      // The BFF fails unless Java returns this avatar, so it is saved.
      await saveAvatar(selected);
      // Show it now; the refresh updates the server-rendered parts.
      onSaved(selected);
      router.refresh();
      if (alive.current) onClose();
    } catch (cause) {
      // A timeout or an odd response can hide a save that went through.
      router.refresh();
      // Session and missing-account messages tell the user what to do next.
      if (alive.current)
        setError(
          cause instanceof ApiClientError &&
            (cause.status === 401 || cause.status === 404)
            ? cause.message
            : AVATAR_SAVE_FAILED,
        );
    } finally {
      submitting.current = false;
      if (alive.current) setPending(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className={styles.editDialog}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      // Chrome can close a modal without a cancel event after repeated
      // Escape presses; keep the parent in sync when that happens. A close
      // queued by an earlier unmount (Strict Mode) finds the dialog open again.
      onClose={(event) => {
        if (!alive.current || event.currentTarget.open) return;
        if (submitting.current) event.currentTarget.showModal();
        else onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        // A radio group contributes one Tab stop; arrows navigate its options.
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input:checked:not(:disabled)",
          ),
        );
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <div className={styles.dialogHeading}>
        <h2 id={`${id}-title`}>Choose your avatar</h2>
        <button
          ref={close}
          type="button"
          className={styles.textButton}
          onClick={requestClose}
          disabled={pending}
        >
          Close
        </button>
      </div>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <fieldset className={styles.avatarOptions} disabled={pending}>
          <legend className={styles.srOnly}>Choose your avatar</legend>
          {AVATARS.map((avatar) => (
            <label key={avatar} className={styles.avatarOption}>
              <input
                type="radio"
                name={`${id}-avatar`}
                value={avatar}
                checked={selected === avatar}
                onChange={() => {
                  setSelected(avatar);
                  setError(null);
                }}
              />
              <span>
                <Thumbnail avatar={avatar} />
                {avatar === current && <small>Current</small>}
              </span>
            </label>
          ))}
        </fieldset>
        {error && (
          <p className={styles.errorText} role="alert">
            {error}
          </p>
        )}
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.textButton}
            onClick={requestClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            ref={saveButton}
            type="submit"
            className={styles.primaryButton}
            disabled={!pending && (selected === null || selected === current)}
            aria-disabled={pending}
            aria-busy={pending}
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
