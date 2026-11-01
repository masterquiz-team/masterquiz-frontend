import Link from "next/link";
import type { CategoriesScreenState } from "../../screen-model";
import styles from "./CategoriesScreen.module.scss";

export function CategoriesNotice({ state }: { state: CategoriesScreenState }) {
  // Only selection results need a message; the design has none by default.
  if (state.kind !== "ready" || (!state.selected && !state.selectionError))
    return null;
  return (
    <div className={styles.notice} role="status">
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
    </div>
  );
}
