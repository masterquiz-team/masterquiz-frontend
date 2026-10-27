import { CategoriesNotice } from "./CategoriesNotice";
import { CategoriesPagination } from "./CategoriesPagination";
import {
  CategoriesEmpty,
  CategoriesError,
  CategoriesList,
  CategoriesPreview,
} from "./CategoriesStates";
// Async server component: it loads its data on the server.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { loadCategoriesScreen } from "../../server/load-categories-screen";
import type { CategoriesQuery } from "../../screen-model";
import styles from "./CategoriesScreen.module.scss";

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
