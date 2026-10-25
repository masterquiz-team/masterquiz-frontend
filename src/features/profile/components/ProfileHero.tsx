"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CountUp } from "@/components/ui/CountUp";
import { useLogout } from "@/features/auth/hooks/useLogout";
import type { Account } from "../types";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileAsset } from "./ProfileAsset";
import { NicknameForm } from "./NicknameForm";
import { DeleteAccount } from "./DeleteAccount";
import styles from "./Profile.module.scss";

const formatCount = (value: number) =>
  Math.round(value).toLocaleString("en-US");

export function ProfileHero({ account }: { account: Account }) {
  const { handleLogout, pending, error } = useLogout();
  const [editing, setEditing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!editing || !element) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    element.showModal();
    close.current?.focus();
    return () => {
      element.close();
      previous?.focus();
    };
  }, [editing]);

  const stats = [
    { label: "Total points", icon: "star", value: account.score },
    {
      label: "Quizzes played",
      icon: "trophy",
      value: account.totalGamesPlayed,
    },
    { label: "Day streak", icon: "flame", value: account.streak },
  ];
  return (
    <section className={styles.hero} aria-labelledby="profile-name">
      <div className={styles.avatarWrap}>
        <ProfileAvatar avatar={account.avatar} />
        <button
          type="button"
          className={styles.pencil}
          aria-label="Edit profile"
          onClick={() => setEditing(true)}
        >
          <ProfileAsset
            src="/images/profile/avatar-edit-pencil.svg"
            size={20}
          />
        </button>
      </div>
      <div className={styles.identity}>
        <h1 id="profile-name">{account.nickname}</h1>
        <p className={styles.tagline}>
          Always curious, always learning.
          <br />
          One quiz at a time!
        </p>
        <dl className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt>
                <ProfileAsset src={`/images/profile/stat-${stat.icon}.svg`} />
                <span>{stat.label}</span>
              </dt>
              <dd>
                <CountUp
                  value={stat.value}
                  from={0}
                  format={formatCount}
                  duration={0.4}
                />
              </dd>
            </div>
          ))}
        </dl>
        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.editButton}
            onClick={() => setEditing(true)}
          >
            <ProfileAsset src="/images/profile/profile-settings.svg" />
            Edit profile
          </button>
          <button
            type="button"
            className={styles.editButton}
            onClick={handleLogout}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? "Please wait…" : "Log out"}
          </button>
        </div>
        {error && (
          <p className={styles.logoutError} role="alert">
            {error}
          </p>
        )}
      </div>
      <dialog
        ref={dialog}
        className={styles.editDialog}
        aria-labelledby={titleId}
        onKeyDown={(event) => {
          // Keep the wrap inside this dialog; a nested confirmation owns its keys.
          if (
            event.key !== "Tab" ||
            !(event.target instanceof Element) ||
            event.target.closest("dialog") !== event.currentTarget
          )
            return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
            ),
          ).filter((element) => element.getClientRects().length > 0);
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
        onCancel={(event) => {
          if (event.target !== event.currentTarget) return;
          event.preventDefault();
          setEditing(false);
        }}
      >
        <div className={styles.dialogHeading}>
          <h2 id={titleId}>Edit profile</h2>
          <button
            ref={close}
            type="button"
            className={styles.textButton}
            onClick={() => setEditing(false)}
          >
            Close
          </button>
        </div>
        <label className={styles.email}>
          Email
          <input
            type="email"
            value={account.email}
            readOnly
            autoComplete="email"
          />
        </label>
        <NicknameForm nickname={account.nickname} />
        <DeleteAccount />
      </dialog>
    </section>
  );
}
