export const NICKNAME_MAX_LENGTH = 50;

// Shared by the form and the BFF route; Java only requires a non-blank value.
export function validateNickname(value: string): string | null {
  const nickname = value.trim();
  if (!nickname) return "Enter your username.";
  if (nickname.length > NICKNAME_MAX_LENGTH)
    return `Use at most ${NICKNAME_MAX_LENGTH} characters.`;
  return null;
}
