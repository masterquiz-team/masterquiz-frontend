export type UserSession = {
  kind: "user";
  email: string;
  expiresAt: string;
};

export type GuestSession = {
  kind: "guest";
  nickname: string;
  expiresAt: string;
};

export type AuthSession = UserSession | GuestSession;

export type AuthSessionState =
  | { status: "anonymous"; session: null }
  | { status: "authenticated"; session: UserSession }
  | { status: "guest"; session: GuestSession }
  | { status: "unavailable"; session: null };
