"use client";
import { useEffect, useRef } from "react";

type Shortcuts = {
  // False while a request is pending, after time-out, on errors and results.
  enabled: boolean;
  optionIds: readonly number[];
  onSelect?: (id: number) => void;
  onConfirm?: () => void;
  onExit?: () => void;
};

// Fields where digits and Enter belong to the user's typing.
function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  return (
    target instanceof HTMLInputElement &&
    !["radio", "checkbox", "button", "submit"].includes(target.type)
  );
}

// Buttons and links already react to Enter on their own.
function handlesEnter(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    target.closest(
      'button, a[href], summary, input[type="button"], input[type="submit"]',
    ) !== null
  );
}

export function useGameShortcuts(shortcuts: Shortcuts) {
  const latest = useRef(shortcuts);
  useEffect(() => {
    latest.current = shortcuts;
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const { enabled, optionIds, onSelect, onConfirm, onExit } =
        latest.current;
      if (
        !enabled ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing
      )
        return;
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (isTyping(event.target)) return;
      // An open modal (the exit dialog) handles its own keys.
      if (document.querySelector("dialog[open]")) return;

      if (/^[1-4]$/.test(event.key) && onSelect) {
        const id = optionIds[Number(event.key) - 1];
        if (id === undefined) return;
        event.preventDefault();
        onSelect(id);
        document
          .querySelector<HTMLInputElement>(`input[type="radio"][value="${id}"]`)
          ?.focus();
      } else if (event.key === "Enter" && onConfirm) {
        if (handlesEnter(event.target)) return;
        event.preventDefault();
        onConfirm();
      } else if (event.key === "Escape" && onExit) {
        event.preventDefault();
        onExit();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
}
