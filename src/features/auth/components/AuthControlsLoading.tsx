import styles from "./AuthControls.module.scss";

export function AuthControlsLoading() {
  return (
    <div className={styles.controls} aria-busy="true">
      <span className={styles.skeleton} aria-hidden="true" />
      <span className={styles.srOnly} role="status">
        Checking session…
      </span>
    </div>
  );
}
