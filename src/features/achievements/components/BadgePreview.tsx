import { Stagger } from "@/components/ui/Entrance";
import { PublicAsset } from "@/components/ui/PublicAsset";
import { profileBadges, type BadgeId } from "../badges";
import styles from "./BadgePreview.module.scss";

// The four-badge strip shared by the profile and leaderboard cards.
// `unlocked` is null when the lookup failed.
export function BadgePreview({
  unlocked,
  className,
}: {
  unlocked: BadgeId[] | null;
  className?: string;
}) {
  const earned = new Set(unlocked ?? []);
  return (
    <>
      <Stagger
        as="ul"
        className={className ? `${styles.badges} ${className}` : styles.badges}
      >
        {profileBadges.map((badge) => {
          const isUnlocked = earned.has(badge.id);
          return (
            <li key={badge.id}>
              <PublicAsset
                src={`/images/achievements/profile-badge-${badge.id}.svg`}
                size={74}
                className={isUnlocked ? undefined : styles.lockedBadge}
              />
              <span>
                {"profileTitle" in badge ? badge.profileTitle : badge.title}
              </span>
              {!isUnlocked && (
                <span className={styles.lockStatus}>
                  <PublicAsset
                    src="/images/achievements/status-locked.svg"
                    size={14}
                  />
                  Locked
                </span>
              )}
            </li>
          );
        })}
      </Stagger>
      {unlocked === null && (
        <p className={styles.error}>Badges could not be loaded.</p>
      )}
    </>
  );
}
