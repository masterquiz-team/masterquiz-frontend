"use client";
import { useEffect, useRef } from "react";

/** Marks the extra history entry that holds the player on an active quiz. */
export const GUARD_KEY = "__mqQuizGuard";

export type LeaveRequest = { kind: "link"; href: string } | { kind: "history" };

type Click = Pick<
  MouseEvent,
  "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey" | "defaultPrevented"
>;

type Anchor = {
  href: string;
  target: string;
  hasAttribute(name: string): boolean;
  closest(selector: string): unknown;
};

/**
 * The in-app destination of a link click that would leave the quiz, or null
 * when the browser or Next.js should handle the click as usual: new tabs,
 * downloads, other origins, links inside a dialog and same-page hash links.
 */
export function leaveHref(click: Click, anchor: Anchor | null, current: URL) {
  if (!anchor || click.defaultPrevented || click.button !== 0) return null;
  if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey)
    return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download") || anchor.closest("dialog")) return null;
  let url: URL;
  try {
    url = new URL(anchor.href, current);
  } catch {
    return null;
  }
  if (url.origin !== current.origin) return null;
  if (url.pathname === current.pathname && url.search === current.search)
    return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

export function isGuardEntry(state: unknown, attemptId: number) {
  return (
    typeof state === "object" &&
    state !== null &&
    (state as Record<string, unknown>)[GUARD_KEY] === attemptId
  );
}

/**
 * Back from the guard entry lands on the quiz URL again (the entry below it).
 * Other traversals, such as Forward or a jump through the history menu, go to
 * another page and are left alone.
 */
export function isBackFromGuard(
  state: unknown,
  attemptId: number,
  href: string,
  quizHref: string,
) {
  return !isGuardEntry(state, attemptId) && href === quizHref;
}

type HistoryEntry = {
  index: number;
  key: string;
  url: string | null;
  sameDocument: boolean;
};
/** The Navigation API, where the browser has it. */
type Navigation = {
  currentEntry: HistoryEntry | null;
  entries(): HistoryEntry[];
  traverseTo(key: string): unknown;
};

/**
 * Goes back to the nearest earlier page that is not the quiz, skipping the
 * quiz's own entries. Without the Navigation API it goes back `steps`. False
 * when there is no such page.
 */
export function goBackPastQuiz(
  win: GuardWindow,
  quizHref: string,
  steps: number,
) {
  const { navigation } = win;
  const current = navigation?.currentEntry;
  if (!navigation || !current) {
    win.history.go(-steps);
    return true;
  }
  const target = navigation
    .entries()
    .slice(0, current.index)
    .findLast((entry) => entry.url !== quizHref);
  if (!target) return false;
  navigation.traverseTo(target.key);
  return true;
}

/** The parts of `window` the guard uses; tests pass a fake. */
export type GuardWindow = Pick<
  Window,
  "history" | "location" | "addEventListener" | "removeEventListener"
> & { navigation?: Navigation };

/** True when the entry below the current one is from another document. */
function startsDocument(navigation: Navigation | undefined) {
  const index = navigation?.currentEntry?.index;
  if (!navigation || !index) return false;
  return navigation.entries()[index - 1]?.sameDocument === false;
}

export type LeaveGuard = {
  /** Stops holding the player, e.g. right before a confirmed exit. */
  release(): void;
  /** Leaves to the page before the quiz; false when there is none. */
  leaveByHistory(): boolean;
  dispose(): void;
};

/**
 * Holds the player on the quiz at `win.location`: link clicks and browser
 * Back become leave requests, and closing or reloading the tab asks the
 * browser to confirm.
 */
export function installLeaveGuard(
  win: GuardWindow,
  attemptId: number,
  onLeaveRequest: (request: LeaveRequest) => void,
): LeaveGuard {
  let released = false;
  const quizHref = win.location.href;
  const arm = () => {
    // Next.js reads its own keys from history.state, so keep them.
    win.history.pushState(
      { ...win.history.state, [GUARD_KEY]: attemptId },
      "",
      quizHref,
    );
  };
  // A return through history may already sit on the entry; keep it.
  if (!isGuardEntry(win.history.state, attemptId)) arm();
  else if (startsDocument(win.navigation)) {
    // After a reload the entry below belongs to the old document, and Back to
    // it reloads the page without a popstate. Hold the player from a new
    // entry in this document instead.
    const state = { ...win.history.state };
    delete state[GUARD_KEY];
    win.history.replaceState(state, "", quizHref);
    arm();
  }

  function onClick(event: MouseEvent) {
    if (released) return;
    const target = event.target as Partial<Element> | null;
    const anchor = (target?.closest?.("a[href]") ?? null) as Anchor | null;
    const href = leaveHref(event, anchor, new URL(win.location.href));
    if (!href) return;
    // Capture on window runs before React, so Link never starts navigating.
    event.preventDefault();
    event.stopPropagation();
    onLeaveRequest({ kind: "link", href });
  }
  function onPopState(event: PopStateEvent) {
    if (released) return;
    if (!isBackFromGuard(event.state, attemptId, win.location.href, quizHref))
      return;
    // Stay on the quiz until the player confirms.
    arm();
    onLeaveRequest({ kind: "history" });
  }
  function onBeforeUnload(event: BeforeUnloadEvent) {
    // A confirmed exit may unload the page; do not ask a second time.
    if (released) return;
    event.preventDefault();
    // Older browsers show the prompt only when returnValue is set.
    event.returnValue = "";
  }
  win.addEventListener("click", onClick, true);
  win.addEventListener("popstate", onPopState);
  win.addEventListener("beforeunload", onBeforeUnload);

  return {
    release() {
      released = true;
    },
    leaveByHistory() {
      released = true;
      // Below the guard entry is the quiz entry, then the previous page.
      const steps = isGuardEntry(win.history.state, attemptId) ? 2 : 1;
      if (goBackPastQuiz(win, quizHref, steps)) return true;
      released = false;
      return false;
    },
    dispose() {
      win.removeEventListener("click", onClick, true);
      win.removeEventListener("popstate", onPopState);
      win.removeEventListener("beforeunload", onBeforeUnload);
    },
  };
}

/** {@link installLeaveGuard} while `active`, for a React component. */
export function useLeaveGuard({
  active,
  attemptId,
  onLeaveRequest,
}: {
  active: boolean;
  attemptId: number;
  onLeaveRequest: (request: LeaveRequest) => void;
}) {
  const latest = useRef(onLeaveRequest);
  useEffect(() => {
    latest.current = onLeaveRequest;
  });
  const guard = useRef<LeaveGuard | null>(null);
  const wasActive = useRef(false);

  useEffect(() => {
    if (!active) return;
    const installed = installLeaveGuard(window, attemptId, (request) =>
      latest.current(request),
    );
    guard.current = installed;
    return () => {
      installed.dispose();
      if (guard.current === installed) guard.current = null;
    };
  }, [active, attemptId]);

  useEffect(() => {
    // Once the quiz ends, drop the guard entry so Back leaves in one press.
    // Not done in the cleanup above: Strict Mode replays it on mount.
    if (
      wasActive.current &&
      !active &&
      isGuardEntry(window.history.state, attemptId)
    )
      window.history.back();
    wasActive.current = active;
  }, [active, attemptId]);

  return {
    release: () => guard.current?.release(),
    leaveByHistory: () => {
      if (guard.current) return guard.current.leaveByHistory();
      // The quiz ended while the dialog was open; its guard entry is gone.
      return goBackPastQuiz(window, window.location.href, 1);
    },
  };
}
