"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAvatar } from "../services/profile";
import { ApiClientError } from "@/lib/api/client";
import { Modal } from "@/components/ui/Modal";
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
    return () => {
      alive.current = false;
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
    <Modal
      busy={pending}
      onClose={requestClose}
      initialFocus={(dialog) =>
        dialog.querySelector<HTMLInputElement>("input:checked") ?? close.current
      }
      className={styles.editDialog}
      aria-labelledby={`${id}-title`}
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
    </Modal>
  );
}
