export type AuthFormMode = "login" | "register";

export type AuthValues = {
  email: string;
  password: string;
  nickname?: string;
  repeatPassword?: string;
};

export type AuthFormValues = Required<AuthValues>;

export type AuthFieldName = keyof AuthValues;

export type AuthFieldErrors = Partial<Record<AuthFieldName, string>>;

export type {
  UserSession,
  GuestSession,
  AuthSession,
  AuthSessionState,
} from "@/lib/backend/session-types";

export type UserProfile = {
  nickname: string | null;
  score: number | null;
};

export type RegisteredUser = {
  id: number;
  email: string;
  nickname: string;
};

export type AuthError = {
  message: string;
  errors?: string[];
  fieldErrors?: AuthFieldErrors;
};

export type AuthSubmitResult =
  { ok: true; signedIn: boolean } | { ok: false; error: AuthError };

export type AuthFeedback = {
  kind: "success" | "error";
  message: string;
  errors?: string[];
};
