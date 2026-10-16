import styles from "./ResultsDashboard.module.scss";

// Decorative vector: the results reference is a flattened raster, not an asset.
export function ResultsTrophy() {
  return (
    <svg
      className={styles.trophy}
      viewBox="0 0 240 160"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse
        cx="120"
        cy="105"
        rx="98"
        ry="45"
        className={styles.trophyBackdrop}
      />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      >
        <path d="M77 39H55v17c0 19 12 29 30 29M163 39h22v17c0 19-12 29-30 29" />
        <path d="M120 101v27M99 134h42" />
      </g>
      <path
        d="M76 27h88v34c0 28-17 45-44 45S76 89 76 61Z"
        fill="currentColor"
      />
      <path
        d="m120 43 7 14 16 2-12 12 3 16-14-8-14 8 3-16-12-12 16-2Z"
        className={styles.trophyStar}
      />
      <g stroke="currentColor" strokeWidth="4" strokeLinecap="round">
        <path d="m37 33 6 4m153-4 6-4M41 101l-7 3m164-2 7 4M64 16l3 6m111-8-3 7" />
      </g>
      <circle cx="62" cy="123" r="4" className={styles.trophyStar} />
      <circle cx="181" cy="119" r="4" className={styles.trophyStar} />
    </svg>
  );
}
