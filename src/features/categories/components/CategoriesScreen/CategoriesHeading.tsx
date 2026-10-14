import styles from "./CategoriesScreen.module.scss";

export function CategoriesHeading() {
  return (
    <h1 className={styles.heading}>
      Pick a category and
      <br />
      start your quiz <span>adventure!</span>
    </h1>
  );
}
