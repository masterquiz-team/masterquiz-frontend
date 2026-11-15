import { useId, type FocusEventHandler } from "react";
import { FieldStatusIcon, FieldIcon, type FieldIconName } from "./FieldIcon";
import styles from "./TextField.module.scss";

export type FieldStatus = "idle" | "valid" | "invalid";

// Pass the field-name type explicitly (<TextField<FieldName> ...>) so a
// typo in `name` fails typecheck.
type TextFieldProps<N extends string = string> = {
  name: N;
  label: string;
  icon: FieldIconName;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  status?: FieldStatus;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  type?: "text" | "email" | "password";
  autoComplete: string;
  placeholder: string;
  minLength?: number;
};

export function TextField<N extends string>({
  name,
  label,
  icon,
  value,
  onValueChange,
  error,
  status = "idle",
  onBlur,
  type = "text",
  autoComplete,
  placeholder,
  minLength,
}: TextFieldProps<N>) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const invalid = Boolean(error) || status === "invalid";
  const valid = !invalid && status === "valid";
  return (
    <div className={styles.label}>
      <label htmlFor={inputId}>{label}</label>
      <span
        className={`${styles.inputWrapper} ${invalid ? styles.invalid : valid ? styles.valid : ""}`}
      >
        <FieldIcon name={icon} />
        <input
          className={styles.input}
          id={inputId}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={minLength}
          required
          aria-invalid={invalid}
          aria-describedby={error ? errorId : undefined}
          value={value}
          onBlur={onBlur}
          onChange={(event) => onValueChange(event.target.value)}
        />
        {(invalid || valid) && <FieldStatusIcon invalid={invalid} />}
      </span>
      {error && (
        <span id={errorId} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
