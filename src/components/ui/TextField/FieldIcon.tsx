import styles from "./FieldIcon.module.scss";

export type FieldIconName = "email" | "user" | "lock";

export function FieldIcon({ name }: { name: FieldIconName }) {
  if (name === "email") {
    return (
      <svg
        className={styles.email}
        viewBox="0 0 30 30"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <rect x="1.875" y="5.625" width="26.25" height="18.75" />
        <path d="m1.875 5.625 13.125 9.375 13.125-9.375" />
      </svg>
    );
  }
  if (name === "user") {
    return (
      <svg
        className={styles.user}
        viewBox="0 0 25 25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <circle cx="12.5" cy="7.8" r="4.3" />
        <path d="M3.3 22.2v-1.1a9.2 9.2 0 0 1 18.4 0v1.1" />
      </svg>
    );
  }
  return (
    <svg
      className={styles.lock}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="10" width="18" height="12" rx="1" />
      <path d="M6 10V7a6 6 0 0 1 12 0v3" />
    </svg>
  );
}

export function FieldStatusIcon({ invalid }: { invalid: boolean }) {
  return invalid ? (
    <ErrorCircleIcon className={styles.status} />
  ) : (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={styles.status}
      aria-hidden="true"
    >
      <path d="m3 10 5 5 9-10" />
    </svg>
  );
}

// Filled circle with a white "!", as in the design's error states.
export function ErrorCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" fill="currentColor" />
      <path
        d="M10 5.5v5.5"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="10" cy="14.25" r="1.25" fill="#fff" />
    </svg>
  );
}
