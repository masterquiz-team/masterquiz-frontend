"use client";

import {
  useEffectEvent,
  useLayoutEffect,
  useRef,
  type CSSProperties,
} from "react";
import { animate, useReducedMotion } from "motion/react";

export type CountUpProps = {
  value: number;
  from?: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
};

const round = (n: number) => String(Math.round(n));
const visuallyHidden: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
};

export function CountUp({
  value,
  from,
  format = round,
  duration = 0.8,
  className,
}: CountUpProps) {
  const digits = useRef<HTMLSpanElement>(null);
  const displayed = useRef(value);
  const reducedMotion = useReducedMotion();
  const renderNumber = useEffectEvent((number: number) => {
    displayed.current = number;
    if (digits.current) digits.current.textContent = format(number);
  });

  // A new formatter updates the current digits without restarting the counter.
  useLayoutEffect(() => {
    renderNumber(displayed.current);
  }, [format]);

  useLayoutEffect(() => {
    const start = from ?? displayed.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches || start === value || duration <= 0) {
      renderNumber(value);
      return;
    }

    // SSR and hydration both render the final value. Set the starting digits
    // before the hydrated paint; interrupted animations resume from their digits.
    renderNumber(start);
    const animation = animate(start, value, {
      duration,
      ease: "easeOut",
      onUpdate: renderNumber,
      onComplete: () => renderNumber(value),
    });
    // Motion's hook captures the initial preference; also stop an active counter
    // immediately when the user enables reduced motion without reloading.
    const stopForReducedMotion = () => {
      if (preference.matches) {
        animation.stop();
        renderNumber(value);
      }
    };
    preference.addEventListener("change", stopForReducedMotion);
    return () => {
      animation.stop();
      preference.removeEventListener("change", stopForReducedMotion);
    };
  }, [value, from, duration, reducedMotion]);

  const finalValue = format(value);
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      <span style={visuallyHidden}>{finalValue}</span>
      <span ref={digits} aria-hidden="true">
        {finalValue}
      </span>
    </span>
  );
}
