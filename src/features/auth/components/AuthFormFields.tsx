import type {
  AuthFieldErrors,
  AuthFieldName,
  AuthFormMode,
  AuthFormValues,
} from "../types";
import { AuthField } from "./AuthField";
import styles from "./AuthFormFields.module.scss";

type AuthFormFieldsProps = {
  mode: AuthFormMode;
  values: AuthFormValues;
  errors: AuthFieldErrors;
  pending: boolean;
  onFieldChange: (field: AuthFieldName, value: string) => void;
};

export function AuthFormFields({
  mode,
  values,
  errors,
  pending,
  onFieldChange,
}: AuthFormFieldsProps) {
  const isRegister = mode === "register";
  return (
    <fieldset disabled={pending} className={styles.fields}>
      <AuthField
        name="email"
        label="Email address"
        icon="email"
        type="email"
        autoComplete="email"
        placeholder="e.g. name@example.com"
        value={values.email}
        error={errors.email}
        onValueChange={(value) => onFieldChange("email", value)}
      />
      {isRegister && (
        <AuthField
          name="nickname"
          label="Username"
          icon="user"
          autoComplete="username"
          placeholder="Enter username"
          value={values.nickname}
          error={errors.nickname}
          onValueChange={(value) => onFieldChange("nickname", value)}
        />
      )}
      <AuthField
        name="password"
        label="Password"
        icon="lock"
        type="password"
        autoComplete={isRegister ? "new-password" : "current-password"}
        placeholder="Enter your password"
        minLength={isRegister ? 8 : undefined}
        value={values.password}
        error={errors.password}
        onValueChange={(value) => onFieldChange("password", value)}
      />
      {isRegister && (
        <AuthField
          name="repeatPassword"
          label="Repeat password"
          icon="lock"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          minLength={8}
          value={values.repeatPassword}
          error={errors.repeatPassword}
          onValueChange={(value) => onFieldChange("repeatPassword", value)}
        />
      )}
    </fieldset>
  );
}
