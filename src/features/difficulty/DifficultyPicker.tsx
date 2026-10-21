"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  difficulties,
  getDifficulty,
  type Difficulty,
} from "@/features/quiz/difficulty";
import { attemptKey, startNewGame } from "@/features/quiz/client";
import Image from "next/image";
import { DesignAsset } from "@/components/ui/DesignAsset";
import { getCategoryArtwork } from "@/features/categories/design-preview";
import type { Category } from "@/features/categories/types";
import { assets } from "./assets";
import styles from "./Difficulty.module.scss";

function ChoiceArtwork({ kind }: { kind: Difficulty }) {
  return (
    <span
      className={`${styles.difficultyArtwork} ${styles[kind]}`}
      aria-hidden="true"
    >
      <DesignAsset
        src={assets[`${kind}-background`]}
        className={styles.artworkBackground}
      />
      <span className={styles.artworkCrop}>
        <DesignAsset src={assets[kind]} className={styles.artworkRaster} />
      </span>
    </span>
  );
}

export function DifficultyPicker({
  category,
  page = 0,
}: {
  category: Category;
  page?: number;
}) {
  const [selected, setSelected] = useState<Difficulty | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uncertainStart, setUncertainStart] = useState(false);
  const starting = useRef(false);
  const router = useRouter();
  async function choose(difficulty: Difficulty) {
    if (starting.current) return;
    starting.current = true;
    setSelected(difficulty);
    setPending(true);
    setError(null);
    try {
      const saved = sessionStorage.getItem(attemptKey(category.id, difficulty));
      if (saved === "unknown")
        throw new Error(
          "A previous start request could not be confirmed. Starting again may create another attempt. Please check the existing attempt before restarting.",
        );
      const id =
        saved &&
        /^\d+$/.test(saved) &&
        Number.isSafeInteger(Number(saved)) &&
        Number(saved) > 0
          ? Number(saved)
          : (await startNewGame(category.id, difficulty)).id;
      router.push(`/quiz/play/${id}?page=${page}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The game could not be started.",
      );
      starting.current = false;
      setPending(false);
      try {
        setUncertainStart(
          sessionStorage.getItem(attemptKey(category.id, difficulty)) ===
            "unknown",
        );
      } catch {
        setUncertainStart(false);
      }
    }
  }
  const artwork = getCategoryArtwork(category.name);
  return (
    <section className={styles.difficulty} aria-labelledby="difficulty-heading">
      {artwork?.name === "Geography" ? (
        <div className={styles.geographyArtwork} aria-hidden="true">
          <DesignAsset
            src={assets["globe-background"]}
            className={styles.geographyBackground}
          />
          <div className={styles.globeCrop}>
            <DesignAsset src={assets.globe} className={styles.globeRaster} />
          </div>
        </div>
      ) : (
        <div className={styles.categoryArtwork}>
          {artwork?.illustration ? (
            <Image src={artwork.illustration} alt="" width={240} height={210} />
          ) : (
            <p>Category illustration unavailable</p>
          )}
        </div>
      )}
      <h1 id="difficulty-heading">Choose your difficulty</h1>
      <div className={styles.headingBar} aria-hidden="true" />
      <div
        className={styles.difficultyGrid}
        role="group"
        aria-label="Difficulty"
        aria-describedby="difficulty-note"
      >
        {difficulties.map((choice) => (
          <button
            type="button"
            key={choice.id}
            className={`${styles.difficultyChoice} ${styles[choice.id]}`}
            aria-pressed={selected === choice.id}
            disabled={!choice.available || pending}
            onClick={() => void choose(choice.id)}
          >
            <ChoiceArtwork kind={choice.id} />
            <span className={styles.choiceTitle}>{choice.label}</span>
            <span className={styles.choiceBars} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className={styles.difficultyDetails}>
              <span>
                <DesignAsset src={assets[`${choice.id}-star`]} />
                {choice.questionCount} questions
              </span>
              <span className={styles.detailSeparator} aria-hidden="true">
                <DesignAsset src={assets[`${choice.id}-separator`]} />
              </span>
              <span>
                <DesignAsset src={assets[`${choice.id}-clock`]} />
                {`~${choice.durationMinutes} min`}
              </span>
            </span>
          </button>
        ))}
      </div>
      <p id="difficulty-note" className={styles.note}>
        Each difficulty starts a ten-question quiz with random questions. The
        time limit depends on the difficulty.
      </p>
      <p
        className={styles.selectionNotice}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {pending &&
          selected &&
          `Opening your ${getDifficulty(selected)?.label} game…`}
      </p>
      {error && (
        <p className={styles.selectionNotice} role="alert">
          {error}
        </p>
      )}
      {uncertainStart && (
        <button
          type="button"
          className={styles.newAttempt}
          onClick={() => {
            if (!selected) return;
            sessionStorage.removeItem(attemptKey(category.id, selected));
            setUncertainStart(false);
            void choose(selected);
          }}
        >
          Start another attempt
        </button>
      )}
    </section>
  );
}
