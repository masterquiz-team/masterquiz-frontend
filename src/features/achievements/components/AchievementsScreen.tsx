"use client";

import Link from "next/link";
import { useState } from "react";
import { Stagger } from "@/components/ui/Entrance";
import { PublicAsset } from "@/components/ui/PublicAsset";
import { badgeArtwork, badgeProgress, badges, type BadgeId } from "../badges";
import styles from "./Achievements.module.scss";

type Filter = "all" | "unlocked" | "locked";

// The design writes the share with a decimal comma: 62,5%.
const percentFormat = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 1,
});

export function AchievementsScreen({
  unlocked,
  progress,
}: {
  unlocked: BadgeId[];
  progress: { totalGamesPlayed: number; streak: number };
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const earned = new Set(unlocked);
  const unlockedCount = badges.filter((badge) => earned.has(badge.id)).length;
  const lockedCount = badges.length - unlockedCount;
  const ratio = unlockedCount / badges.length;
  const filters = [
    { id: "all", label: "All", count: badges.length },
    { id: "unlocked", label: "Unlocked", count: unlockedCount },
    { id: "locked", label: "Locked", count: lockedCount },
  ] as const;
  const visible = badges.filter((badge) =>
    filter === "all" ? true : earned.has(badge.id) === (filter === "unlocked"),
  );
  const hint =
    lockedCount === 0
      ? "You have unlocked every badge!"
      : unlockedCount === 0
        ? "Finish a quiz to unlock your first badge!"
        : "Keep playing to unlock more!";
  return (
    <div className={styles.achievements}>
      <Link href="/profile" className={styles.back}>
        <PublicAsset src="/images/achievements/arrow-back.svg" />
        Back
      </Link>
      <div className={styles.heading}>
        <div>
          <h1>
            Achievements
            {/* Local image preserves the decoration's non-square viewBox. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/achievements/achievements-heading-decoration.svg"
              width={72}
              height={68}
              alt=""
              className={styles.headingDecoration}
            />
          </h1>
          <p>Celebrate your progress and discover your next challenge.</p>
        </div>
        <section
          className={styles.summary}
          aria-labelledby="achievement-summary"
        >
          <PublicAsset
            src="/images/achievements/achievements-summary-level.svg"
            size={90}
          />
          <div>
            <h2 id="achievement-summary">
              {unlockedCount} of {badges.length} badges unlocked
            </h2>
            <div className={styles.summaryProgress}>
              <div
                className={styles.track}
                role="progressbar"
                aria-label="Badges unlocked"
                aria-valuemin={0}
                aria-valuemax={badges.length}
                aria-valuenow={unlockedCount}
              >
                <span style={{ width: `${ratio * 100}%` }} />
              </div>
              <span>{percentFormat.format(ratio * 100)}%</span>
            </div>
            <p>{hint}</p>
          </div>
        </section>
      </div>
      <div
        className={styles.filters}
        role="group"
        aria-label="Filter achievements"
      >
        {filters.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>
      <p className={styles.srOnly} role="status">
        {visible.length} {filter === "all" ? "" : `${filter} `}badges shown
      </p>
      {visible.length === 0 ? (
        <p className={styles.empty}>
          {filter === "unlocked"
            ? "No badges yet. Finish a quiz to unlock your first one!"
            : "You have unlocked every badge!"}
        </p>
      ) : (
        <Stagger as="ul" key={filter} className={styles.grid}>
          {visible.map((badge) => {
            const isUnlocked = earned.has(badge.id);
            const counter = isUnlocked
              ? null
              : badgeProgress(badge.id, progress);
            return (
              <li key={badge.id} className={styles.card}>
                <PublicAsset
                  src={badgeArtwork(badge, isUnlocked)}
                  size={85}
                  className={
                    isUnlocked || "lockedIcon" in badge
                      ? undefined
                      : styles.lockedArtwork
                  }
                />
                <span
                  className={`${styles.rarity} ${styles[badge.rarity.toLowerCase()]}`}
                >
                  {badge.rarity}
                </span>
                <h2>{badge.title}</h2>
                <p>{badge.description}</p>
                {counter && (
                  <div className={styles.counter}>
                    <div
                      className={styles.counterTrack}
                      role="progressbar"
                      aria-label={`${badge.title} progress`}
                      aria-valuemin={0}
                      aria-valuemax={counter.max}
                      aria-valuenow={counter.value}
                    >
                      <span
                        style={{
                          width: `${(counter.value / counter.max) * 100}%`,
                        }}
                      />
                    </div>
                    <span>
                      {counter.value} / {counter.max}
                      {counter.unit}
                    </span>
                  </div>
                )}
                {isUnlocked ? (
                  <div className={styles.unlocked}>
                    <PublicAsset
                      src="/images/achievements/status-unlocked.svg"
                      size={27}
                    />
                    Unlocked
                  </div>
                ) : (
                  <div className={styles.locked}>
                    <PublicAsset
                      src="/images/achievements/status-locked.svg"
                      size={18}
                    />
                    Locked
                  </div>
                )}
              </li>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
