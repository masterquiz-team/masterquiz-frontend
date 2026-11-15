// The backend ships avatar-1..avatar-8; the picker and the BFF offer only these.
export const AVATAR_COUNT = 8;

export const AVATARS = Array.from(
  { length: AVATAR_COUNT },
  (_, index) => index + 1,
);

export const isAvatar = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= AVATAR_COUNT;

export const AVATAR_SAVE_FAILED =
  "Couldn't save your avatar. Please try again later.";
