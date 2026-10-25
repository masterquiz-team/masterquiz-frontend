import "server-only";

import type { AuthFormMode, AuthValues } from "../types";
import { isRegisteredUser, parseAuthError } from "../validators/responses";
import { backendFetch } from "@/lib/backend/transport";
import { isRecord } from "@/lib/validation";
import { getSessionToken, isGuestToken } from "@/lib/backend/token";
import { authJson } from "./request";
import { readTokenSession, setSessionCookie } from "./session";

// Route Handlers validate HTTP input; this function owns the Java auth exchange.
export async function authenticate(mode: AuthFormMode, payload: AuthValues) {
  try {
    const currentToken = await getSessionToken();
    const guestToken =
      currentToken && (await isGuestToken(currentToken)) ? currentToken : null;
    const response = await backendFetch(
      `/${mode}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      guestToken,
    );
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
      const body = {
        user: {
          id: result.id,
          email: result.email,
          nickname: result.nickname,
        },
      };
      const registrationToken: unknown =
        "token" in result ? result.token : null;
      if (guestToken) {
        // Registration currently returns a user DTO without a JWT. Sign in
        // with the submitted credentials, forwarding the guest token again.
        // If sign-in fails, registration still succeeded: retain the guest
        // session and let the existing registered -> login flow take over.
        try {
          let login: unknown = result;
          if (typeof registrationToken !== "string") {
            const loginResponse = await backendFetch(
              "/login",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: payload.email,
                  password: payload.password,
                }),
              },
              guestToken,
            );
            login = loginResponse.ok ? await loginResponse.json() : null;
          }
          const token =
            isRecord(login) && typeof login.token === "string"
              ? login.token
              : null;
          const session = token ? readTokenSession(token) : null;
          if (token && session?.kind === "user") {
            const reply = authJson({ ...body, session }, response.status);
            setSessionCookie(reply, token, session);
            return reply;
          }
        } catch {
          // Preserve the successful registration and the existing guest cookie.
        }
      }
      return authJson(body, response.status);
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
  } catch (error) {
    console.error("[authenticate] Backend authentication failed", error);
    return authJson(
      {
        message:
          "The backend is unavailable or took too long to respond. Please try again later.",
      },
      502,
    );
  }
}
