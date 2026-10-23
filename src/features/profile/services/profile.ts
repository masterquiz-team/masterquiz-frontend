import type { Account } from "../types";

async function profileRequest<T>(method: "PUT" | "DELETE", body: unknown) {
  let response: Response;
  try {
    response = await fetch("/api/profile", {
      method,
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("The connection was interrupted. Please try again.");
  }
  const value = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      typeof value?.message === "string"
        ? value.message
        : "The account could not be updated. Please try again.",
    );
  return value as T;
}

export const saveNickname = (nickname: string) =>
  profileRequest<Account>("PUT", { nickname });

export const removeAccount = () => profileRequest<unknown>("DELETE", {});
