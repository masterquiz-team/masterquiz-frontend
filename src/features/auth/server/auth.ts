import "server-only";

import type { AuthFormMode, AuthValues } from "../types";
import { isRegisteredUser, parseAuthError } from "../validators/responses";
import { backendFetch } from "@/lib/backend/transport";
import { isRecord } from "@/lib/validation";
import { authJson } from "./request";
import {
  clearSessionCookie,
  getSessionState,
  readTokenSession,
  setSessionCookie,
} from "./session";

// Route Handlers validate HTTP input; this function owns the Java auth exchange.
export async function authenticate(mode: AuthFormMode, payload: AuthValues) {
  let invalidSession = false;
  const replyJson: typeof authJson = (body, status) => {
    const reply = authJson(body, status);
    if (invalidSession) clearSessionCookie(reply);
    return reply;
  };
  try {
    const state = await getSessionState();
    invalidSession = state.status === "anonymous";
    // Future guest-progress transfer must pass the guest explicitly in a
    // dedicated field or separate request agreed with the backend, not via
    // Authorization: a 401 could mean bad credentials or an invalid guest token.
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
      return replyJson(parseAuthError(result, fallback), response.status);
    }
    if (!isRecord(result)) {
      return replyJson(
        { message: "The API returned an unexpected response." },
        502,
      );
    }

    if (mode === "register") {
      if (!isRegisteredUser(result)) {
        return replyJson(
          { message: "The API returned an unexpected response." },
          502,
        );
      }
      const body = {
        user: {
          id: result.id,
          email: result.email,
          nickname: result.nickname,
        },
      };
      const registrationToken: unknown =
        "token" in result ? result.token : null;
      if (state.status === "guest") {
        // Registration currently returns a user DTO without a JWT. Sign in
        // with the submitted credentials and no guest Authorization header.
        // If sign-in fails, registration still succeeded: retain the guest
        // session and let the existing registered -> login flow take over.
        try {
          let login: unknown = result;
          if (typeof registrationToken !== "string") {
            const loginResponse = await backendFetch("/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: payload.email,
                password: payload.password,
              }),
            });
            login = loginResponse.ok ? await loginResponse.json() : null;
          }
          const token =
            isRecord(login) && typeof login.token === "string"
              ? login.token
              : null;
          const session = token ? readTokenSession(token) : null;
          if (token && session?.kind === "user") {
            const reply = replyJson({ ...body, session }, response.status);
            setSessionCookie(reply, token, session);
            return reply;
          }
        } catch {
          // Preserve successful registration and the existing guest cookie.
        }
      }
      return replyJson(body, response.status);
    }

    const token = typeof result.token === "string" ? result.token : null;
    const session = token ? readTokenSession(token) : null;
    if (!token || !session) {
      return replyJson(
        { message: "The API returned an invalid login session." },
        502,
      );
    }
    const reply = replyJson({ session });
    setSessionCookie(reply, token, session);
    return reply;
  } catch (error) {
    console.error("[authenticate] Backend authentication failed", error);
    return replyJson(
      {
        message:
          "The backend is unavailable or took too long to respond. Please try again later.",
      },
      502,
    );
  }
}
