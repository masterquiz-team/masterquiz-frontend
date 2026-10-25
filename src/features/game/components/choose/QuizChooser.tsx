"use client";

import Image from "next/image";
import { Reveal, Stagger } from "@/components/ui/Entrance";
import { useId, useState, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { getDifficulty, type Difficulty } from "@/features/game/difficulty";
import { useStartGame } from "@/features/game/hooks/useStartGame";
import { GuestAccessLinks } from "@/features/auth/components/GuestAccessLinks";
import { displayQuizTitle, type QuizSummary } from "@/features/game/quizzes";
import type { GameStart } from "@/features/game/services/game";
import { getCategoryArtwork } from "@/features/categories/artwork";
import type { Category } from "@/features/categories/types";
import {
  ArrowIcon,
  CheckIcon,
  PeopleIcon,
  RandomQuizArtwork,
  SearchIcon,
  ShuffleIcon,
  StarIcon,
} from "./QuizChooserIcons";
import styles from "./QuizChooser.module.scss";

const tabs = [
  { id: "all", label: "All quizzes", icon: null },
  { id: "masterquiz", label: "MasterQuiz", icon: <StarIcon size={18} /> },
  { id: "community", label: "Community", icon: <PeopleIcon size={20} /> },
] as const;
type Tab = (typeof tabs)[number]["id"];

const randomReasons = [
  "Get a mix of topics",
  "Test your overall knowledge",
  "Great for a quick challenge",
];

const sameStart = (a: GameStart | null, b: GameStart) =>
  !!a &&
  ("quizId" in a
    ? "quizId" in b && a.quizId === b.quizId
    : !("quizId" in b) &&
      a.categoryId === b.categoryId &&
      a.difficulty === b.difficulty);

export function QuizChooser({
  category,
  difficulty,
  page,
  quizzes,
  randomAvailable,
}: {
  category: Category;
  difficulty: Difficulty;
  page: number;
  quizzes: QuizSummary[];
  randomAvailable: boolean;
}) {
  const id = useId();
  const reducedMotion = useReducedMotion();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const {
    selected,
    pending,
    error,
    guestRestricted,
    uncertain,
    start,
    discardSavedAttempt,
  } = useStartGame({
    page,
    unconfirmedMessage:
      "A previous start request could not be confirmed. Starting again may create another attempt. Please check the existing attempt before restarting.",
  });
  const config = getDifficulty(difficulty)!;
  const artwork = getCategoryArtwork(category.name);
  const random: GameStart = { categoryId: category.id, difficulty };
  const query = search.trim().toLowerCase();
  // Every quiz the backend serves is made by the MasterQuiz team; the backend
  // has no community quizzes yet.
  const visible =
    tab === "community"
      ? []
      : quizzes
          .map((quiz) => ({
            ...quiz,
            label: displayQuizTitle(quiz.title, category.name),
          }))
          .filter((quiz) => quiz.label.toLowerCase().includes(query));

  function moveTab(event: KeyboardEvent<HTMLButtonElement>) {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = tabs.findIndex((item) => item.id === tab);
    const next = tabs[(index + step + tabs.length) % tabs.length];
    setTab(next.id);
    document.getElementById(`${id}-tab-${next.id}`)?.focus();
  }

  const emptyMessage =
    tab === "community"
      ? "Community quizzes are coming soon."
      : query
        ? `No quizzes match “${search.trim()}”.`
        : randomAvailable
          ? "There are no ready-made quizzes for this difficulty yet. Try a random quiz."
          : "There are no ready-made quizzes for this difficulty yet.";

  return (
    <Reveal
      as="section"
      className={styles.chooser}
      aria-labelledby={`${id}-heading`}
    >
      <ul className={styles.badges} aria-label="Selected options">
        <li>{category.name}</li>
        <li>{config.label}</li>
      </ul>
      <h1 id={`${id}-heading`}>Choose a quiz</h1>
      <div className={styles.headingBar} aria-hidden="true" />

      <div
        className={`${styles.layout} ${randomAvailable ? "" : styles.savedOnly}`}
      >
        {randomAvailable && (
          <aside className={styles.randomPanel} aria-label="Random quiz">
            <button
              type="button"
              className={styles.randomCard}
              disabled={pending}
              onClick={() => void start(random)}
            >
              <span className={styles.randomIcon}>
                <ShuffleIcon />
              </span>
              <span className={styles.randomText}>
                <strong>Random Quiz</strong>
                <span>{config.questionCount} random questions</span>
                <span>
                  {pending && sameStart(selected, random)
                    ? "Opening your game…"
                    : "Start instantly"}
                </span>
              </span>
              <span className={styles.randomArrow}>
                <ArrowIcon />
              </span>
            </button>
            <div className={styles.reasons}>
              <h2>Why play a random quiz?</h2>
              <ul>
                {randomReasons.map((reason) => (
                  <li key={reason}>
                    <CheckIcon />
                    {reason}
                  </li>
                ))}
              </ul>
              <span className={styles.randomArtwork}>
                <RandomQuizArtwork />
              </span>
            </div>
          </aside>
        )}

        <div className={styles.listPanel}>
          <div className={styles.toolbar}>
            <div
              role="tablist"
              aria-label="Quiz source"
              className={styles.tabs}
            >
              {tabs.map((item) => (
                <button
                  key={item.id}
                  id={`${id}-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  aria-controls={`${id}-panel`}
                  tabIndex={tab === item.id ? 0 : -1}
                  className={styles.tab}
                  onClick={() => setTab(item.id)}
                  onKeyDown={moveTab}
                >
                  {item.icon}
                  {item.label}
                  {tab === item.id && (
                    <motion.span
                      aria-hidden="true"
                      className={styles.tabUnderline}
                      layoutId={
                        reducedMotion === false
                          ? `${id}-tab-underline`
                          : undefined
                      }
                      initial={false}
                      transition={{
                        duration: reducedMotion === false ? 0.24 : 0,
                        ease: "easeOut",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
            <label className={styles.search}>
              <SearchIcon />
              <span className={styles.visuallyHidden}>Search quizzes</span>
              <input
                type="search"
                placeholder="Search quizzes"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div
            id={`${id}-panel`}
            role="tabpanel"
            aria-labelledby={`${id}-tab-${tab}`}
            className={styles.panelBody}
          >
            {visible.length ? (
              <Stagger as="ul" className={styles.quizList}>
                {visible.map((quiz) => {
                  const target: GameStart = { quizId: quiz.id };
                  const opening = pending && sameStart(selected, target);
                  return (
                    <li key={quiz.id}>
                      <button
                        type="button"
                        className={styles.quizRow}
                        disabled={pending}
                        aria-describedby={`${id}-quiz-${quiz.id}`}
                        onClick={() => void start(target)}
                      >
                        <span className={styles.quizIcon} aria-hidden="true">
                          {artwork?.illustration && (
                            <Image
                              src={artwork.illustration}
                              alt=""
                              width={48}
                              height={42}
                            />
                          )}
                        </span>
                        <span className={styles.quizText}>
                          <strong>{quiz.label}</strong>
                          <span
                            id={`${id}-quiz-${quiz.id}`}
                            className={styles.quizMeta}
                          >
                            {opening
                              ? "Opening your game…"
                              : `${quiz.questionCount} questions · ${config.durationMinutes} min`}
                          </span>
                          <span className={styles.quizAuthor}>
                            <StarIcon />
                            MasterQuiz team
                          </span>
                        </span>
                        <span className={styles.sourceBadge}>MasterQuiz</span>
                      </button>
                    </li>
                  );
                })}
              </Stagger>
            ) : (
              <p className={styles.empty}>{emptyMessage}</p>
            )}
          </div>
        </div>
      </div>

      <p className={styles.notice} role="status" aria-live="polite">
        {pending ? "Opening your game…" : ""}
      </p>
      {error && (
        <p className={styles.notice} role="alert">
          {error}
        </p>
      )}
      {guestRestricted && <GuestAccessLinks />}
      {uncertain && selected && (
        <button
          type="button"
          className={styles.newAttempt}
          onClick={() => {
            discardSavedAttempt(selected);
            void start(selected);
          }}
        >
          Start another attempt
        </button>
      )}
    </Reveal>
  );
}
