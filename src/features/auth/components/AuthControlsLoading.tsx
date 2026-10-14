import styles from "./AuthControls.module.scss";

export function AuthControlsLoading() {
  return (
    <div className={styles.controls} aria-busy="true">
      <span role="status">Checking session…</span>
    </div>
  );
}
