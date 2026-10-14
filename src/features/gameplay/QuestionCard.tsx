"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import type { AnswerFeedback, GameplayOption } from "./types";
import { assets } from "./assets";
import { DesignAsset } from "./GameplayArtwork";
import styles from "./Gameplay.module.scss";

export function CardMeta({
  category,
  progress,
}: {
  category: string;
  progress: string;
}) {
  return (
    <div className={styles.cardMeta}>
      <span className={styles.category}>{category}</span>
      <span className={styles.progress}>{progress}</span>
    </div>
  );
}

export function NextButton({
  children = "Next",
  filled = false,
  disabled = false,
  onClick,
}: {
  children?: ReactNode;
  filled?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.next} ${filled ? styles.filled : ""}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
      <DesignAsset
        src={filled ? assets.correct.nextArrow : assets.question.nextArrow}
      />
    </button>
  );
}

export function QuestionCard({
  category,
  progress,
  question,
  options,
  selectedId,
  feedback = [],
  onSelect,
  next,
  disabled = false,
}: {
  category: string;
  progress: string;
  question: string;
  options: readonly GameplayOption[];
  selectedId: number | null;
  feedback?: readonly AnswerFeedback[];
  onSelect: (id: number) => void;
  disabled?: boolean;
  next?: { onClick: () => void; disabled?: boolean; label?: string };
}) {
  const id = useId();
  const reviewed = feedback.length > 0;
  return (
    <section
      className={`${styles.card} ${next ? styles.withNext : ""}`}
      aria-labelledby={`${id}-question`}
    >
      <CardMeta category={category} progress={progress} />
      <h1 id={`${id}-question`} className={styles.question} tabIndex={-1}>
        {question}
      </h1>
      <fieldset className={styles.options} disabled={reviewed || disabled}>
        <legend className={styles.srOnly}>Choose an answer</legend>
        {options.map((option) => {
          const outcome = feedback.find(
            (item) => item.optionId === option.id,
          )?.outcome;
          const selected = selectedId === option.id;
          const radio =
            outcome === "incorrect"
              ? assets.wrong.radio
              : outcome === "correct"
                ? assets.wrong.correctRadio
                : selected
                  ? assets.selected.radio
                  : assets.question.radio;
          return (
            <label
              key={option.id}
              className={`${styles.option} ${outcome ? styles[outcome] : selected ? styles.selected : ""}`}
            >
              <input
                type="radio"
                name={`${id}-answer`}
                value={option.id}
                checked={selected}
                onChange={() => onSelect(option.id)}
                aria-describedby={
                  outcome ? `${id}-${option.id}-outcome` : undefined
                }
              />
              <span className={styles.radioArtwork} aria-hidden="true">
                <DesignAsset src={radio} />
                {selected && (
                  <DesignAsset
                    src={
                      outcome === "incorrect"
                        ? assets.wrong.dot
                        : assets.selected.dot
                    }
                    className={styles.radioDot}
                  />
                )}
              </span>
              <span className={styles.optionText}>{option.label}</span>
              {outcome && (
                <>
                  <span className={styles.outcomeIcon} aria-hidden="true">
                    <DesignAsset
                      src={
                        outcome === "correct"
                          ? assets.wrong.correctBadge
                          : assets.wrong.cross
                      }
                    />
                    {outcome === "correct" && (
                      <DesignAsset
                        src={assets.wrong.check}
                        className={styles.optionCheck}
                      />
                    )}
                  </span>
                  <span
                    id={`${id}-${option.id}-outcome`}
                    className={styles.srOnly}
                  >
                    {outcome === "correct"
                      ? "Correct answer"
                      : "Incorrect answer"}
                  </span>
                </>
              )}
            </label>
          );
        })}
      </fieldset>
      {reviewed && (
        <p className={styles.srOnly} role="status">
          Answer feedback:{" "}
          {feedback
            .map(
              (item) =>
                `${options.find((option) => option.id === item.optionId)?.label}: ${item.outcome}`,
            )
            .join("; ")}
        </p>
      )}
      {next && (
        <NextButton
          filled={selectedId !== null}
          disabled={next.disabled}
          onClick={next.onClick}
        >
          {next.label ?? "Next"}
        </NextButton>
      )}
    </section>
  );
}
