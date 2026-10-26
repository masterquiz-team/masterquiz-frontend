import "client-only";

export const ATTEMPT_STORAGE_PREFIX = "masterquiz-attempt:";

export function clearSavedAttempts(): void {
  try {
    // Collect first: removing keys changes sessionStorage's numeric indexes.
    const storage = window.sessionStorage;
    const keys = Object.keys(storage).filter((key) =>
      key.startsWith(ATTEMPT_STORAGE_PREFIX),
    );
    for (const key of keys) storage.removeItem(key);
  } catch {
    // Blocked browser storage must not interrupt a confirmed identity change.
  }
}
