export const NICKNAME_MAX_LENGTH = 50;

// Java only requires non-blank; the browser and BFF enforce the remaining rules.
export function validateNickname(value: string): string | null {
  const nickname = value.trim();
  if (!nickname) return "Enter your username.";
  if (Array.from(nickname).length > NICKNAME_MAX_LENGTH)
    return `Use at most ${NICKNAME_MAX_LENGTH} characters.`;
  if (!/[\p{L}\p{N}]/u.test(nickname))
    return "Use at least one letter or digit.";
  return null;
}
