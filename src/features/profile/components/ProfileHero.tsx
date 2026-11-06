"use client";

import { useId, useRef, useState } from "react";
import { CountUp } from "@/components/ui/CountUp";
import { useModalDialog } from "@/components/ui/useModalDialog";
import { useLogout } from "@/features/auth/hooks/useLogout";
import type { Account } from "../types";
import { AvatarPicker } from "./AvatarPicker";
import { ProfileAvatar } from "./ProfileAvatar";
import { PublicAsset } from "@/components/ui/PublicAsset";
import { NicknameForm } from "./NicknameForm";
import { DeleteAccount } from "./DeleteAccount";
import { formatNumber } from "@/lib/format";
import styles from "./Profile.module.scss";

export function ProfileHero({ account }: { account: Account }) {
  const { handleLogout, pending, error } = useLogout();
  const [pickingAvatar, setPickingAvatar] = useState(false);
  // The saved avatar shows until router.refresh() brings a newer account.
  const [saved, setSaved] = useState<{
    avatar: number;
    over: number | null;
  } | null>(null);
  const avatar =
    saved && saved.over === account.avatar ? saved.avatar : account.avatar;
  const [editing, setEditing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useModalDialog(dialog, {
    open: editing,
    onClose: () => setEditing(false),
    initialFocus: () => close.current,
  });

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
        <ProfileAvatar avatar={avatar} />
        <button
          type="button"
          className={styles.pencil}
          aria-label="Change avatar"
          onClick={() => setPickingAvatar(true)}
        >
          <PublicAsset src="/images/profile/avatar-edit-pencil.svg" size={20} />
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
                <PublicAsset src={`/images/profile/stat-${stat.icon}.svg`} />
                <span>{stat.label}</span>
              </dt>
              <dd>
                <CountUp
                  value={stat.value}
                  from={0}
                  format={formatNumber}
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
            <PublicAsset src="/images/profile/profile-settings.svg" />
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
      {pickingAvatar && (
        <AvatarPicker
          current={avatar}
          onSaved={(next) => setSaved({ avatar: next, over: account.avatar })}
          onClose={() => setPickingAvatar(false)}
        />
      )}
      <dialog
        ref={dialog}
        className={styles.editDialog}
        aria-labelledby={titleId}
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
