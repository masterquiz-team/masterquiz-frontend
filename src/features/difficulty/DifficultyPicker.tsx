"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { difficulties, type Difficulty } from "@/features/quiz/difficulty";
import { attemptKey, startEasy } from "@/features/quiz/client";
import Image from "next/image";
import { DesignAsset } from "@/components/ui/DesignAsset";
import { categoryArtwork } from "@/features/categories/design-preview";
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
  async function chooseEasy() {
    if (starting.current) return;
    starting.current = true;
    setSelected("easy");
    setPending(true);
    setError(null);
    try {
      const saved = sessionStorage.getItem(attemptKey(category.id));
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
          : (await startEasy(category.id)).id;
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
          sessionStorage.getItem(attemptKey(category.id)) === "unknown",
        );
      } catch {
        setUncertainStart(false);
      }
    }
  }
  const artwork = categoryArtwork.find(
    (item) => item.name.toLowerCase() === category.name.toLowerCase(),
  );
  return (
    <section className={styles.difficulty} aria-labelledby="difficulty-heading">
      {category.name.toLowerCase() === "geography" ? (
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
            onClick={chooseEasy}
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
        Easy starts a ten-question quiz. Medium and Hard are unavailable. Times
        shown are design estimates; this game has no time limit.
      </p>
      <p
        className={styles.selectionNotice}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {pending && "Opening your Easy game…"}
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
            sessionStorage.removeItem(attemptKey(category.id));
            setUncertainStart(false);
            void chooseEasy();
          }}
        >
          Start another attempt
        </button>
      )}
    </section>
  );
}
