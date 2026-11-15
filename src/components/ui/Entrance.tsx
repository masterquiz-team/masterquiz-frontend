"use client";

import { useEffect, type HTMLAttributes } from "react";
import { MotionConfig, useAnimate, useReducedMotion } from "motion/react";
import styles from "./Entrance.module.scss";

type EntranceProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "main" | "section" | "ul" | "ol" | "tbody";
};

function Entrance({
  as: Component = "div",
  children,
  className,
  staggered = false,
  ...props
}: EntranceProps & { staggered?: boolean }) {
  const [scope, animate] = useAnimate();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const element: HTMLElement | null = scope.current;
    if (reducedMotion !== false || !element) return;
    const targets = staggered ? Array.from(element.children) : [element];
    if (!targets.length) return;

    // SSR stays visible; only animate after hydration, without changing layout.
    const animation = animate(
      targets,
      { opacity: [0, 1], y: [8, 0] },
      {
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
        delay: (index) => (staggered ? Math.min(index * 0.04, 0.2) : 0),
      },
    );
    return () => animation.complete();
  }, [animate, reducedMotion, scope, staggered]);

  return (
    <MotionConfig reducedMotion="user">
      <Component
        {...props}
        ref={scope}
        className={`${staggered ? styles.stagger : styles.reveal}${className ? ` ${className}` : ""}`}
      >
        {children}
      </Component>
    </MotionConfig>
  );
}

export function Reveal(props: EntranceProps) {
  return <Entrance {...props} />;
}

// Reuse the existing list/table element so its children keep their semantics.
export function Stagger(props: EntranceProps) {
  return <Entrance {...props} staggered />;
}
