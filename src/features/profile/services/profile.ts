import { apiRequest } from "@/lib/api/client";
import { parseAccount } from "../validators";

const messages = {
  fallbackMessage: "The account could not be updated. Please try again.",
  networkMessage: "The connection was interrupted. Please try again.",
};

export const saveNickname = (nickname: string) =>
  apiRequest("/api/profile", {
    ...messages,
    method: "PUT",
    body: { nickname },
    // The route reads the account and then saves it: two backend calls of
    // up to 10 s each.
    timeoutMs: 30_000,
    parse: parseAccount,
  });

export const removeAccount = () =>
  apiRequest("/api/profile", {
    ...messages,
    method: "DELETE",
    body: {},
    parse: () => undefined,
  });
