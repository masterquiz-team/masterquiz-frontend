import "client-only";

import { isRecord } from "@/lib/validation";

export const DEFAULT_API_TIMEOUT = 15_000;
export const GAME_ACTION_TIMEOUT = 45_000;

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type ApiRequestOptions<T> = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  parse: (value: unknown, status: number) => T | Promise<T>;
  timeoutMs?: number;
  fallbackMessage: string;
  networkMessage?: string;
  timeoutMessage?: string;
};

export async function apiRequest<T>(
  path: string,
  {
    method = "GET",
    body,
    parse,
    timeoutMs = DEFAULT_API_TIMEOUT,
    fallbackMessage,
    networkMessage = "The connection was interrupted. Please try again.",
    timeoutMessage = "The request timed out. Please try again.",
  }: ApiRequestOptions<T>,
): Promise<T> {
  let response: Response;
  let value: unknown;
  try {
    response = await fetch(path, {
      method,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      ...(body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
    // Keep transport errors (including a timeout while reading the body)
    // distinct from a successful response that is not JSON.
    value = await response.json().catch((cause: unknown) => {
      if (cause instanceof SyntaxError) return undefined;
      throw cause;
    });
  } catch (cause) {
    const timedOut =
      cause instanceof Error &&
      (cause.name === "TimeoutError" || cause.name === "AbortError");
    throw new ApiClientError(0, timedOut ? timeoutMessage : networkMessage);
  }

  if (!response.ok)
    throw new ApiClientError(
      response.status,
      isRecord(value) && typeof value.message === "string"
        ? value.message
        : fallbackMessage,
      isRecord(value) && typeof value.code === "string"
        ? value.code
        : undefined,
      value,
    );

  if (value === undefined) throw new ApiClientError(502, fallbackMessage);
  try {
    return await parse(value, response.status);
  } catch {
    throw new ApiClientError(502, fallbackMessage);
  }
}
