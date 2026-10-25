import type { Category } from "@/features/categories/types";
import { Stagger } from "@/components/ui/Entrance";
import type { Leaderboard } from "../types";
import { CategorySelect, CategoryTiles } from "./CategoryFilter";
import { CrownIcon, MedalIcon, UserIcon } from "./LeaderboardIcons";
import styles from "./Leaderboard.module.scss";

const formatPoints = (value: number) => value.toLocaleString("en-US");
const medal = ["gold", "silver", "bronze"] as const;

function TableBody({
  board,
  category,
}: {
  board: Leaderboard;
  category: boolean;
}) {
  if (board.status !== "ok" || !board.entries.length)
    return (
      <p className={styles.empty} role="status">
        {board.status === "error"
          ? "The leaderboard could not be loaded. Please try again."
          : category
            ? "No one has a score in this category yet."
            : "No one has a score yet."}
      </p>
    );
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Player</th>
          <th scope="col">{category ? "Category score" : "Total score"}</th>
          <th scope="col">Games played</th>
        </tr>
      </thead>
      <Stagger as="tbody">
        {board.entries.map((entry) => (
          <tr
            key={entry.rank}
            className={entry.currentUser ? styles.currentRow : undefined}
            aria-current={entry.currentUser ? "true" : undefined}
          >
            <td>
              <span className={styles.rank}>
                {entry.rank}
                {entry.rank <= 3 && (
                  <span className={styles[medal[entry.rank - 1]]}>
                    <CrownIcon size={24} />
                  </span>
                )}
              </span>
            </td>
            <td>
              <span className={styles.player}>
                <UserIcon />
                {entry.nickname}
              </span>
            </td>
            <td>{formatPoints(entry.score)}</td>
            <td>{entry.gamesPlayed}</td>
          </tr>
        ))}
      </Stagger>
    </table>
  );
}

export function LeaderboardScreen({
  board,
  categories,
  selected,
  player,
  demo,
}: {
  board: Leaderboard;
  categories: Category[];
  selected: number | null;
  player: { nickname: string | null; score: number | null };
  demo: boolean;
}) {
  const me = board.status === "ok" ? board.me : null;
  const rank =
    selected === null
      ? me?.rank
      : board.status === "ok"
        ? board.entries.find((entry) => entry.currentUser)?.rank
        : undefined;
  const score =
    selected === null
      ? (me?.totalScore ?? player.score)
      : me
        ? (me.scoreByCategoryId[String(selected)] ?? 0)
        : null;
  return (
    <div className={styles.leaderboard}>
      <header className={styles.intro}>
        <div>
          <h1>
            Leaderboard
            <br />
            Play. Learn. Compete.
          </h1>
          <div className={styles.textPlaceholder} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className={styles.imagePlaceholder} aria-hidden="true" />
      </header>

      <section
        className={`${styles.card} ${styles.rankCard}`}
        aria-labelledby="your-rank"
      >
        <h2 id="your-rank">
          <CrownIcon />
          Your current rank
        </h2>
        <div className={styles.rankRow}>
          <span className={styles.avatar}>
            <UserIcon size={40} />
          </span>
          <span className={styles.rankText}>
            <strong>{demo ? "You" : (player.nickname ?? "You")}</strong>
            <span>{rank === undefined ? "Rank unavailable" : `#${rank}`}</span>
          </span>
          <span className={styles.points}>
            {score === null ? "—" : `${formatPoints(score)} pts`}
          </span>
        </div>
      </section>

      <section
        className={`${styles.card} ${styles.tableCard}`}
        aria-label="Rankings"
      >
        <div className={styles.toolbar}>
          <div className={styles.scope} role="group" aria-label="Ranking scope">
            <button type="button" aria-pressed="true">
              Global
            </button>
            <button
              type="button"
              aria-pressed="false"
              disabled
              title="Coming soon"
            >
              Country
            </button>
          </div>
          <CategorySelect
            categories={categories}
            selected={selected}
            demo={demo}
          />
        </div>
        <TableBody
          key={selected ?? "global"}
          board={board}
          category={selected !== null}
        />
      </section>

      <div className={styles.side}>
        <CategoryTiles
          categories={categories}
          selected={selected}
          demo={demo}
        />
        <section
          className={`${styles.card} ${styles.badges}`}
          aria-labelledby="your-badges"
        >
          <h2 id="your-badges">
            <MedalIcon />
            Your badges
          </h2>
          <p>Badges are coming soon.</p>
        </section>
      </div>

      {demo && (
        <p className={styles.demoNote} role="note">
          Demo data from the design. Visible in development only.
        </p>
      )}
    </div>
  );
}
