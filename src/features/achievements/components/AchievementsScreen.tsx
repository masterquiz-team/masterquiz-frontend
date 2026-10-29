"use client";

import Link from "next/link";
import { useState } from "react";
import { Stagger } from "@/components/ui/Entrance";
import { PublicAsset } from "@/components/ui/PublicAsset";
import { badges } from "../badges";
import styles from "./Achievements.module.scss";

const filters = [
  { id: "all", label: "All", count: badges.length },
  { id: "unlocked", label: "Unlocked", count: 0 },
  { id: "locked", label: "Locked", count: badges.length },
] as const;

export function AchievementsScreen() {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const visible = filter === "unlocked" ? [] : badges;
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
            <PublicAsset
              src="/images/achievements/achievements-heading-decoration.svg"
              size={58}
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
              0 of {badges.length} badges unlocked
            </h2>
            <div className={styles.summaryProgress}>
              <div
                className={styles.track}
                role="progressbar"
                aria-label="Badges unlocked"
                aria-valuemin={0}
                aria-valuemax={badges.length}
                aria-valuenow={0}
              />
              <span>0%</span>
            </div>
            <p>Achievements are coming soon. Keep playing!</p>
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
        {visible.length} {filter === "unlocked" ? "unlocked" : "locked"} badges
        shown
      </p>
      {visible.length === 0 ? (
        <p className={styles.empty}>
          Achievements are coming soon. Keep playing!
        </p>
      ) : (
        <Stagger as="ul" key={filter} className={styles.grid}>
          {visible.map((badge) => (
            <li key={badge.id} className={styles.card}>
              <PublicAsset
                src={
                  "lockedIcon" in badge
                    ? badge.lockedIcon
                    : `/images/achievements/badge-${badge.id}.svg`
                }
                size={85}
                className={styles.lockedArtwork}
              />
              <span
                className={`${styles.rarity} ${styles[badge.rarity.toLowerCase()]}`}
              >
                {badge.rarity}
              </span>
              <h2>{badge.title}</h2>
              <p>{badge.description}</p>
              <div className={styles.locked}>
                <PublicAsset
                  src="/images/achievements/status-locked.svg"
                  size={18}
                />
                Locked
              </div>
            </li>
          ))}
        </Stagger>
      )}
    </div>
  );
}
