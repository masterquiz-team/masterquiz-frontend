"use client";

import { useLayoutEffect } from "react";
import { useAnimate, useReducedMotion } from "motion/react";
import styles from "./Profile.module.scss";

export function LevelProgress({
  ratio,
  label,
}: {
  ratio: number;
  label: string;
}) {
  const [scope, animate] = useAnimate();
  const reducedMotion = useReducedMotion();
  useLayoutEffect(() => {
    if (
      reducedMotion !== false ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const animation = animate(
      scope.current,
      { scaleX: [0, ratio] },
      { duration: 0.4, ease: "easeOut" },
    );
    return () => animation.complete();
  }, [animate, ratio, reducedMotion, scope]);
  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
    >
      <span ref={scope} style={{ transform: `scaleX(${ratio})` }} />
    </div>
  );
}
