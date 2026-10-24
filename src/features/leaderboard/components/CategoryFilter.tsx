"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getCategoryArtwork } from "@/features/categories/artwork";
import type { Category } from "@/features/categories/types";
import { ChevronIcon, FilterIcon } from "./LeaderboardIcons";
import styles from "./Leaderboard.module.scss";

const PREVIEW = 5;

const hrefFor = (categoryId: number | null, demo: boolean) => {
  const query = new URLSearchParams();
  if (categoryId) query.set("category", String(categoryId));
  if (demo) query.set("demo", "1");
  const text = query.toString();
  return text ? `/leaderboard?${text}` : "/leaderboard";
};

// The dropdown above the table.
export function CategorySelect({
  categories,
  selected,
  demo,
}: {
  categories: Category[];
  selected: number | null;
  demo: boolean;
}) {
  const router = useRouter();
  return (
    <label className={styles.select}>
      <span className={styles.visuallyHidden}>Category</span>
      <select
        value={selected ?? ""}
        onChange={(event) =>
          router.push(
            hrefFor(
              event.target.value ? Number(event.target.value) : null,
              demo,
            ),
          )
        }
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <ChevronIcon />
    </label>
  );
}

// The "Categories" card next to the table.
export function CategoryTiles({
  categories,
  selected,
  demo,
}: {
  categories: Category[];
  selected: number | null;
  demo: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? categories : categories.slice(0, PREVIEW);
  const tile = (id: number | null, name: string) => {
    const artwork = id ? getCategoryArtwork(name) : null;
    return (
      <li key={id ?? "all"}>
        <button
          type="button"
          className={styles.tile}
          aria-pressed={selected === id}
          onClick={() => router.push(hrefFor(id, demo))}
        >
          {artwork?.illustration && (
            <Image src={artwork.illustration} alt="" width={40} height={35} />
          )}
          {name}
        </button>
      </li>
    );
  };
  return (
    <section className={styles.card} aria-labelledby="leaderboard-categories">
      <div className={styles.cardHeading}>
        <h2 id="leaderboard-categories">
          <FilterIcon />
          Categories
        </h2>
        {categories.length > PREVIEW && (
          <button
            type="button"
            className={styles.viewAll}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Show less" : "View all"}
          </button>
        )}
      </div>
      <ul className={styles.tiles}>
        {tile(null, "All categories")}
        {visible.map((category) => tile(category.id, category.name))}
      </ul>
    </section>
  );
}
