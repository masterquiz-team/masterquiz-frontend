// Line icons from the Leaderboard frame. They inherit currentColor.
const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function CrownIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 28 22"
      width={size}
      height={size * 0.8}
      aria-hidden="true"
      {...line}
    >
      <path d="M3 6l5.5 5L14 3l5.5 8L25 6l-2.5 12h-17L3 6Z" />
    </svg>
  );
}

export function UserIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 28 28"
      width={size}
      height={size}
      aria-hidden="true"
      {...line}
    >
      <circle cx="14" cy="14" r="12.5" />
      <circle cx="14" cy="11" r="4.5" />
      <path d="M6.5 22.5c1.6-3.6 4.2-5.4 7.5-5.4s5.9 1.8 7.5 5.4" />
    </svg>
  );
}

export function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      {...line}
    >
      <path d="M4 7h16M7 12h10M10 17h4" />
    </svg>
  );
}

export function MedalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      {...line}
    >
      <path d="M8 3l3 7M16 3l-3 7M9 3h6" />
      <circle cx="12" cy="15.5" r="5" />
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      {...line}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
