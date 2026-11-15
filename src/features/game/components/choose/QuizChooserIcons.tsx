// Line icons from the "Choose a quiz" frame. They inherit currentColor.
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function ShuffleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="44"
      height="44"
      aria-hidden="true"
      {...stroke}
    >
      <path d="M3 7h3.5c2 0 3.2 1 4.3 2.6l2.4 3.8C14.3 15 15.5 17 17.5 17H21" />
      <path d="M3 17h3.5c1.4 0 2.4-.6 3.2-1.5M13.8 8.5C14.6 7.6 15.7 7 17.5 7H21" />
      <path d="m18 4 3 3-3 3M18 14l3 3-3 3" />
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      {...stroke}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path
        d="m6 10.2 2.6 2.6L14 7.6"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      {...stroke}
    >
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    </svg>
  );
}

export function PeopleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      {...stroke}
    >
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
      <circle cx="17" cy="8.5" r="2.5" />
      <path d="M16.5 13.6c2.4.2 4 1.7 4.5 4.4" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      {...stroke}
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

// Target and books from the random-quiz card, simplified to line art.
export function RandomQuizArtwork() {
  return (
    <svg
      viewBox="0 0 280 180"
      width="280"
      height="180"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M120 112h96c8 0 14 6 14 14v6c0 8-6 14-14 14h-96" />
      <path d="M120 112c-8 0-12 8-12 17s4 17 12 17" />
      <path d="M128 124h80M128 134h80" opacity=".55" />
      <path d="M104 146h108c8 0 14 6 14 14v2c0 6-5 10-11 10H104" />
      <path d="M104 146c-7 0-10 6-10 13s3 13 10 13" />
      <path d="M112 159h90" opacity=".55" />
      <circle cx="100" cy="84" r="38" fill="var(--quiz-art-fill, #f1f0fe)" />
      <circle cx="100" cy="84" r="25" />
      <circle cx="100" cy="84" r="11" fill="currentColor" />
      <path d="m100 84 44-44" />
      <path d="m132 36 14-6-4 14M138 46l12-2" />
      <path d="M232 52v14M225 59h14M48 120v12M42 126h12M246 104v10M241 109h10M170 22v8M166 26h8" />
    </svg>
  );
}
