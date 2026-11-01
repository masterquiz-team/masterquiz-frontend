import type {
  AuthFieldErrors,
  AuthFieldName,
  AuthFormMode,
  AuthFormValues,
} from "../types";
import { TextField, type FieldStatus } from "@/components/ui/TextField";
import styles from "./AuthFormFields.module.scss";

type AuthFormFieldsProps = {
  mode: AuthFormMode;
  values: AuthFormValues;
  errors: AuthFieldErrors;
  pending: boolean;
  statuses: Partial<Record<AuthFieldName, FieldStatus>>;
  onFieldBlur: (field: AuthFieldName) => void;
  onFieldChange: (field: AuthFieldName, value: string) => void;
};

export function AuthFormFields({
  mode,
  values,
  errors,
  pending,
  statuses,
  onFieldBlur,
  onFieldChange,
}: AuthFormFieldsProps) {
  const isRegister = mode === "register";
  return (
    <fieldset disabled={pending} className={styles.fields}>
      <TextField<AuthFieldName>
        name="email"
        label="Email address"
        icon="email"
        type="email"
        autoComplete="email"
        placeholder="e.g. name@example.com"
        value={values.email}
        error={errors.email}
        status={statuses.email}
        onBlur={() => onFieldBlur("email")}
        onValueChange={(value) => onFieldChange("email", value)}
      />
      {isRegister && (
        <TextField<AuthFieldName>
          name="nickname"
          label="Username"
          icon="user"
          autoComplete="username"
          placeholder="Enter username"
          value={values.nickname}
          error={errors.nickname}
          status={statuses.nickname}
          onBlur={() => onFieldBlur("nickname")}
          onValueChange={(value) => onFieldChange("nickname", value)}
        />
      )}
      <TextField<AuthFieldName>
        name="password"
        label="Password"
        icon="lock"
        type="password"
        autoComplete={isRegister ? "new-password" : "current-password"}
        placeholder="Enter your password"
        minLength={isRegister ? 8 : undefined}
        value={values.password}
        error={errors.password}
        status={statuses.password}
        onBlur={() => onFieldBlur("password")}
        onValueChange={(value) => onFieldChange("password", value)}
      />
      {isRegister && (
        <TextField<AuthFieldName>
          name="repeatPassword"
          label="Repeat password"
          icon="lock"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          minLength={8}
          value={values.repeatPassword}
          error={errors.repeatPassword}
          status={statuses.repeatPassword}
          onBlur={() => onFieldBlur("repeatPassword")}
          onValueChange={(value) => onFieldChange("repeatPassword", value)}
        />
      )}
    </fieldset>
  );
}
