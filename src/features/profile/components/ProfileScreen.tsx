import Link from "next/link";
import { Stagger } from "@/components/ui/Entrance";
import { getCategoryArtwork } from "@/features/categories/artwork";
import type { Category } from "@/features/categories/types";
import { difficultyHref } from "@/features/game/routes";
import type { Account } from "../types";
import { getLevelProgress } from "../levels";
import { profileBadges } from "@/features/achievements/badges";
import { ProfileHero } from "./ProfileHero";
import { PublicAsset } from "@/components/ui/PublicAsset";
import { LevelProgress } from "./LevelProgress";
import { formatNumber } from "@/lib/format";
import styles from "./Profile.module.scss";

export function ProfileScreen({
  account,
  favourites,
}: {
  account: Account;
  favourites: Category[];
}) {
  const progress = getLevelProgress(account.score, account.level);
  return (
    <div className={styles.profile}>
      <div className={styles.top}>
        <ProfileHero account={account} />
        <div className={styles.side}>
          <section
            className={`${styles.card} ${styles.levelCard}`}
            aria-labelledby="your-level"
          >
            <h2 id="your-level">Your level</h2>
            <div className={styles.level}>
              <PublicAsset src={progress.current.icon} size={90} />
              <div>
                <h3>{progress.current.title}</h3>
                <p className={styles.points}>
                  {progress.next
                    ? `${formatNumber(account.score)} / ${formatNumber(progress.next.minPoints)} pts`
                    : `${formatNumber(account.score)} pts`}
                </p>
                <LevelProgress
                  ratio={progress.ratio}
                  label={`Level ${progress.current.number} progress`}
                />
                <p className={styles.hint}>
                  {progress.next
                    ? `${formatNumber(progress.remaining)} points to level ${progress.next.number}`
                    : "Max level reached"}
                </p>
              </div>
            </div>
          </section>
          <section
            className={`${styles.card} ${styles.badgesCard}`}
            aria-labelledby="your-badges"
          >
            <div className={styles.cardHeading}>
              <h2 id="your-badges">Your badges</h2>
              <span className={styles.comingSoon}>Coming soon</span>
              <Link href="/achievements">
                View all<span className={styles.srOnly}> badges</span>
              </Link>
            </div>
            <Stagger as="ul" className={styles.badges}>
              {profileBadges.map((badge) => (
                <li key={badge.id}>
                  <PublicAsset
                    src={`/images/achievements/profile-badge-${badge.id}.svg`}
                    size={74}
                    className={styles.lockedBadge}
                  />
                  <span>
                    {"profileTitle" in badge ? badge.profileTitle : badge.title}
                  </span>
                  <span className={styles.lockStatus}>
                    <PublicAsset
                      src="/images/achievements/status-locked.svg"
                      size={14}
                    />
                    Locked
                  </span>
                </li>
              ))}
            </Stagger>
          </section>
        </div>
      </div>
      <div className={styles.bottom}>
        <section
          className={`${styles.card} ${styles.activity}`}
          aria-labelledby="recent-activity"
        >
          <h2 id="recent-activity">
            <PublicAsset src="/images/profile/activity-clock.svg" />
            Recent activity
          </h2>
          <p className={styles.empty}>
            <PublicAsset src="/images/profile/activity-clock.svg" size={28} />
            <span>Your recent games will appear here soon.</span>
          </p>
        </section>
        <section
          className={`${styles.card} ${styles.favouritesCard}`}
          aria-labelledby="favourite-categories"
        >
          <div className={styles.cardHeading}>
            <h2 id="favourite-categories">
              <PublicAsset src="/images/profile/favourite-star.svg" />
              <span>Favourite categories</span>
            </h2>
            <Link href="/categories">
              View all<span className={styles.srOnly}> categories</span>
            </Link>
          </div>
          <Stagger as="ul" className={styles.categories}>
            <li>
              <Link href="/categories" className={styles.allCategories}>
                All categories
              </Link>
            </li>
            {favourites.map((category) => {
              const artwork = getCategoryArtwork(category.name);
              return (
                <li key={category.id}>
                  <Link href={difficultyHref(category.id, 0)}>
                    {artwork?.illustration && (
                      <PublicAsset src={artwork.illustration} size={52} />
                    )}
                    <span>{category.name}</span>
                  </Link>
                </li>
              );
            })}
          </Stagger>
          {favourites.length === 0 && (
            <p className={styles.hint}>
              Play quizzes to see your favourite categories here.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
