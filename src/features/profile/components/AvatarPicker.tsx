"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAvatar } from "../services/profile";
import { ApiClientError } from "@/lib/api/client";
import styles from "./Profile.module.scss";

const failureMessage = "Couldn't save your avatar. Please try again later.";

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
  onClose,
}: {
  current: number | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const alive = useRef(false);
  const submitting = useRef(false);
  const id = useId();
  const [selected, setSelected] = useState(current);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Saving disables the controls, so give focus back once the error shows.
  useEffect(() => {
    if (!error) return;
    dialog.current
      ?.querySelector<HTMLInputElement>("input:checked:not(:disabled)")
      ?.focus();
  }, [error]);

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
    setPending(true);
    setError(null);
    try {
      await saveAvatar(selected);
      router.refresh();
      if (alive.current) onClose();
    } catch (cause) {
      // Session and missing-account messages tell the user what to do next.
      if (alive.current)
        setError(
          cause instanceof ApiClientError &&
            (cause.status === 401 || cause.status === 404)
            ? cause.message
            : failureMessage,
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
          {Array.from({ length: 8 }, (_, index) => index + 1).map((avatar) => (
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
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={pending || selected === null || selected === current}
            aria-busy={pending}
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
