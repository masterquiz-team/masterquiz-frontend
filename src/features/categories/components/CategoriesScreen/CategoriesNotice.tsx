import Link from "next/link";
import type { CategoriesScreenState } from "./categories-screen-model";
import styles from "./CategoriesScreen.module.scss";

export function CategoriesNotice({ state }: { state: CategoriesScreenState }) {
  return (
    <div className={styles.notice} role="status">
      {state.kind === "preview" && (
        <p>
          Design preview — <Link href={state.loginHref}>log in</Link> to browse
          available categories. Preview cards open the login page.
        </p>
      )}
      {state.kind === "ready" && (
        <>
          {!state.selectionError &&
            !state.selected &&
            state.data.content.length > 0 && (
              <p>Select a category to continue.</p>
            )}
          {state.selected && !state.selectionError && (
            <p>
              Selected: <strong>{state.selected.name}</strong>.{" "}
              <Link
                href={`/categories/difficulty?category=${state.selected.id}&page=${state.page}`}
              >
                Choose difficulty
              </Link>
              .{" "}
              <Link href={`/categories?page=${state.page}`} scroll={false}>
                Clear selection
              </Link>
            </p>
          )}
          {state.selectionError && (
            <p>
              {state.selectionError}{" "}
              <Link href={`/categories?page=${state.page}`}>
                Back to categories
              </Link>{" "}
              · <a href={state.retryHref}>Try again</a>
            </p>
          )}
        </>
      )}
    </div>
  );
}
