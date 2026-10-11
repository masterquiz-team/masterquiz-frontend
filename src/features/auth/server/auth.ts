import "server-only";

import type { AuthFormMode, AuthValues } from "../types";
import {
  isRecord,
  isRegisteredUser,
  parseAuthError,
} from "../validators/responses";
import { backendFetch } from "./backend";
import { authJson } from "./request";
import { readTokenSession, setSessionCookie } from "./session";

// Route Handlers validate HTTP input; this function owns the Java auth exchange.
export async function authenticate(mode: AuthFormMode, payload: AuthValues) {
  try {
    const response = await backendFetch(`/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const fallback =
        mode === "login" && response.status === 401
          ? "The email or password was not accepted."
          : mode === "register" && response.status === 409
            ? "An account with this email already exists."
            : "The API rejected the request. Please check your details and try again.";
      return authJson(parseAuthError(result, fallback), response.status);
    }
    if (!isRecord(result)) {
      return authJson(
        { message: "The API returned an unexpected response." },
        502,
      );
    }

    if (mode === "register") {
      if (!isRegisteredUser(result)) {
        return authJson(
          { message: "The API returned an unexpected response." },
          502,
        );
      }
      return authJson(
        {
          user: {
            id: result.id,
            email: result.email,
            nickname: result.nickname,
          },
        },
        response.status,
      );
    }

    const token = typeof result.token === "string" ? result.token : null;
    const session = token ? readTokenSession(token) : null;
    if (!token || !session) {
      return authJson(
        { message: "The API returned an invalid login session." },
        502,
      );
    }
    const reply = authJson({ session });
    setSessionCookie(reply, token, session);
    return reply;
  } catch {
    return authJson(
      {
        message:
          "The backend is unavailable or took too long to respond. Please try again later.",
      },
      502,
    );
  }
}
