import styles from "./CategoriesScreen.module.scss";

export function CategoriesLoading() {
  return (
    <div className={styles.screen}>
      <p className={styles.notice} role="status">
        Loading categories…
      </p>
      <ul className={styles.grid} aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <li key={index} className={styles.loadingCard} />
        ))}
      </ul>
    </div>
  );
}
