import { useId } from "react";
import { FieldIcon, type FieldIconName } from "./FieldIcon";
import styles from "./TextField.module.scss";

type TextFieldProps = {
  name: string;
  label: string;
  icon: FieldIconName;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  type?: "text" | "email" | "password";
  autoComplete: string;
  placeholder: string;
  minLength?: number;
};

export function TextField({
  name,
  label,
  icon,
  value,
  onValueChange,
  error,
  type = "text",
  autoComplete,
  placeholder,
  minLength,
}: TextFieldProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  return (
    <div className={styles.label}>
      <label htmlFor={inputId}>{label}</label>
      <span className={`${styles.inputWrapper} ${error ? styles.invalid : ""}`}>
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
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        />
      </span>
      {error && (
        <span id={errorId} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
