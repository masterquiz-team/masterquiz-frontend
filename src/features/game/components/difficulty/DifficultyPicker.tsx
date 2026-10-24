import Link from "next/link";
import { difficulties, type Difficulty } from "@/features/game/difficulty";
import { quizListHref } from "@/features/game/routes";
import { GlobeArtwork } from "../GlobeArtwork";
import Image from "next/image";
import { DesignAsset } from "@/components/ui/DesignAsset";
import { Reveal, Stagger } from "@/components/ui/Entrance";
import { getCategoryArtwork } from "@/features/categories/artwork";
import type { Category } from "@/features/categories/types";
import { assets } from "../../assets/difficulty";
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
  const artwork = getCategoryArtwork(category.name);
  return (
    <Reveal
      as="section"
      className={styles.difficulty}
      aria-labelledby="difficulty-heading"
    >
      {artwork?.name === "Geography" ? (
        <div className={styles.geographyArtwork} aria-hidden="true">
          <DesignAsset
            src={assets["globe-background"]}
            className={styles.geographyBackground}
          />
          <GlobeArtwork
            src={assets.globe}
            classes={{
              globeCrop: styles.globeCrop,
              globeRaster: styles.globeRaster,
            }}
          />
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
      <Stagger
        className={styles.difficultyGrid}
        role="group"
        aria-label="Difficulty"
        aria-describedby="difficulty-note"
      >
        {difficulties.map((choice) => (
          <Link
            key={choice.id}
            href={quizListHref(category.id, choice.id, page)}
            prefetch={false}
            className={`${styles.difficultyChoice} ${styles[choice.id]}`}
            aria-label={`${choice.label}: ${choice.questionCount} questions, about ${choice.durationMinutes} minutes`}
          >
            <ChoiceArtwork kind={choice.id} />
            <span className={styles.choiceTitle}>{choice.label}</span>
            <span className={styles.choiceBars} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className={styles.difficultyDetails} aria-hidden="true">
              <span>
                <DesignAsset src={assets[`${choice.id}-star`]} />
                {choice.questionCount} questions
              </span>
              <span className={styles.detailSeparator}>
                <DesignAsset src={assets[`${choice.id}-separator`]} />
              </span>
              <span>
                <DesignAsset src={assets[`${choice.id}-clock`]} />
                {`~${choice.durationMinutes} min`}
              </span>
            </span>
          </Link>
        ))}
      </Stagger>
      <p id="difficulty-note" className={styles.note}>
        Next, pick a ready-made quiz or start a random one. The time limit
        depends on the difficulty.
      </p>
    </Reveal>
  );
}
