import { CategoriesNotice } from "./CategoriesNotice";
import { CategoriesPagination } from "./CategoriesPagination";
import {
  CategoriesEmpty,
  CategoriesError,
  CategoriesList,
  CategoriesPreview,
} from "./CategoriesStates";
import { loadCategoriesScreen } from "./load-categories-screen";
import type { CategoriesQuery } from "./categories-screen-model";
import styles from "./CategoriesScreen.module.scss";

// Preserve existing direct imports while new consumers use the folder entrypoint.
export { CategoriesHeading } from "./CategoriesHeading";
export { CategoriesLoading } from "./CategoriesLoading";

export async function CategoriesScreen({
  searchParams,
}: {
  searchParams: Promise<CategoriesQuery>;
}) {
  const state = await loadCategoriesScreen(searchParams);
  return (
    <div className={styles.screen}>
      <CategoriesNotice state={state} />
      {state.kind === "error" ? (
        <CategoriesError {...state} />
      ) : state.kind === "preview" ? (
        <CategoriesPreview playHref={state.playHref} />
      ) : state.data.content.length ? (
        <CategoriesList
          categories={state.data.content}
          selected={state.selected}
          page={state.page}
        />
      ) : (
        <CategoriesEmpty data={state.data} />
      )}
      {state.kind === "ready" && <CategoriesPagination {...state} />}
    </div>
  );
}
