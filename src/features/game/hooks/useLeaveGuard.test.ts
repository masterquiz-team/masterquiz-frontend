import { describe, expect, it, vi } from "vitest";
import {
  GUARD_KEY,
  installLeaveGuard,
  isBackFromGuard,
  isGuardEntry,
  leaveHref,
  type GuardWindow,
  type LeaveRequest,
} from "./useLeaveGuard";

const QUIZ = "http://app.test/quiz/play/7?page=1";
const current = new URL(QUIZ);

const click = (overrides: Partial<MouseEvent> = {}) => ({
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  defaultPrevented: false,
  ...overrides,
});

const anchor = (
  href: string,
  { target = "", download = false, inDialog = false } = {},
) => ({
  href: new URL(href, current).href,
  target,
  hasAttribute: (name: string) => name === "download" && download,
  closest: (selector: string) =>
    selector === "dialog" && inDialog ? {} : null,
});

describe("leaveHref", () => {
  it("returns the in-app destination of a plain click", () => {
    expect(leaveHref(click(), anchor("/leaderboard"), current)).toBe(
      "/leaderboard",
    );
    expect(leaveHref(click(), anchor("/#about"), current)).toBe("/#about");
    expect(leaveHref(click(), anchor("/categories/quizzes?c=2"), current)).toBe(
      "/categories/quizzes?c=2",
    );
  });

  it("leaves new-tab and modified clicks to the browser", () => {
    for (const modifier of [
      { metaKey: true },
      { ctrlKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
      { defaultPrevented: true },
    ])
      expect(
        leaveHref(click(modifier), anchor("/leaderboard"), current),
      ).toBeNull();
    expect(
      leaveHref(click(), anchor("/leaderboard", { target: "_blank" }), current),
    ).toBeNull();
    expect(
      leaveHref(click(), anchor("/file", { download: true }), current),
    ).toBeNull();
  });

  it("ignores other origins, dialog links and the quiz page itself", () => {
    expect(leaveHref(click(), anchor("https://x.test/"), current)).toBeNull();
    expect(
      leaveHref(click(), anchor("/profile", { inDialog: true }), current),
    ).toBeNull();
    expect(
      leaveHref(click(), anchor("/quiz/play/7?page=1#top"), current),
    ).toBeNull();
    expect(leaveHref(click(), null, current)).toBeNull();
  });
});

describe("history entries", () => {
  it("recognises only this attempt's guard entry", () => {
    expect(isGuardEntry({ [GUARD_KEY]: 7 }, 7)).toBe(true);
    expect(isGuardEntry({ [GUARD_KEY]: 8 }, 7)).toBe(false);
    expect(isGuardEntry(null, 7)).toBe(false);
  });

  it("treats only a return to the quiz URL as Back from the guard", () => {
    expect(isBackFromGuard({ __NA: true }, 7, QUIZ, QUIZ)).toBe(true);
    expect(isBackFromGuard({ [GUARD_KEY]: 7 }, 7, QUIZ, QUIZ)).toBe(false);
    expect(
      isBackFromGuard({ __NA: true }, 7, "http://app.test/leaderboard", QUIZ),
    ).toBe(false);
  });
});

// `doc` names the document an entry belongs to; a reload starts a new one.
type Entry = { state: unknown; href: string; doc?: string };

function fakeWindow(entries: Entry[], { navigationApi = true } = {}) {
  let index = entries.length - 1;
  let doc = entries[index].doc ?? "a";
  const docOf = (entry: Entry) => entry.doc ?? "a";
  const listeners = new Map<string, Set<(event: unknown) => void>>();
  const emit = (type: string, event: unknown) =>
    listeners.get(type)?.forEach((listener) => listener(event));
  const traverse = (delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= entries.length) return;
    index = next;
    // A cross-document traversal loads a page instead of firing popstate.
    if (docOf(entries[index]) !== doc) doc = docOf(entries[index]);
    else emit("popstate", { state: entries[index].state });
  };
  const historyEntries = () =>
    entries.map((entry, i) => ({
      index: i,
      key: String(i),
      url: entry.href,
      sameDocument: docOf(entry) === doc,
    }));
  const win = {
    history: {
      get state() {
        return entries[index].state;
      },
      pushState(state: unknown, _: string, href: string) {
        entries.splice(index + 1, Infinity, { state, href, doc });
        index += 1;
      },
      replaceState(state: unknown, _: string, href: string) {
        entries[index] = { state, href, doc };
      },
      go: traverse,
      back: () => traverse(-1),
    },
    location: {
      get href() {
        return entries[index].href;
      },
    },
    navigation: navigationApi
      ? {
          get currentEntry() {
            return historyEntries()[index];
          },
          entries: historyEntries,
          traverseTo: (key: string) => traverse(Number(key) - index),
        }
      : undefined,
    addEventListener(type: string, listener: (event: unknown) => void) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener(type: string, listener: (event: unknown) => void) {
      listeners.get(type)?.delete(listener);
    },
  };
  return {
    win: win as unknown as GuardWindow,
    entries,
    back: () => traverse(-1),
    emit,
    listenerCount: () =>
      [...listeners.values()].reduce((sum, set) => sum + set.size, 0),
  };
}

const quizList = { state: { __NA: true }, href: "http://app.test/categories" };
const quiz = { state: { __NA: true, tree: "quiz" }, href: QUIZ };

describe("installLeaveGuard", () => {
  it("adds one guard entry that keeps Next.js history state", () => {
    const fake = fakeWindow([quizList, { ...quiz }]);
    installLeaveGuard(fake.win, 7, () => {});
    expect(fake.entries).toHaveLength(3);
    expect(fake.entries[2]).toMatchObject({
      state: { __NA: true, tree: "quiz", [GUARD_KEY]: 7 },
      href: QUIZ,
    });
    // Returning to the guard entry through history must not add another.
    installLeaveGuard(fake.win, 7, () => {});
    expect(fake.entries).toHaveLength(3);
  });

  it("holds the player from this document after a reload", () => {
    const guarded = { state: { ...quiz.state, [GUARD_KEY]: 7 }, href: QUIZ };
    const fake = fakeWindow([quizList, { ...quiz }, { ...guarded, doc: "b" }]);
    const onLeave = vi.fn();
    const guard = installLeaveGuard(fake.win, 7, onLeave);
    expect(fake.entries.map((entry) => entry.doc ?? "a")).toEqual([
      "a",
      "a",
      "b",
      "b",
    ]);
    expect(isGuardEntry(fake.entries[2].state, 7)).toBe(false);
    fake.back();
    expect(onLeave).toHaveBeenCalledWith({ kind: "history" });
    // Confirming skips every quiz entry, whichever document holds it.
    expect(guard.leaveByHistory()).toBe(true);
    expect(fake.win.location.href).toBe(quizList.href);
  });

  it("turns browser Back into a request and keeps the player on the quiz", () => {
    const fake = fakeWindow([quizList, { ...quiz }]);
    const requests: LeaveRequest[] = [];
    installLeaveGuard(fake.win, 7, (request) => requests.push(request));
    fake.back();
    expect(requests).toEqual([{ kind: "history" }]);
    expect(fake.win.location.href).toBe(QUIZ);
    expect(isGuardEntry(fake.win.history.state, 7)).toBe(true);
    // Pressing Back again while the dialog is open asks again, still in place.
    fake.back();
    expect(requests).toHaveLength(2);
    expect(fake.entries).toHaveLength(3);
  });

  it("goes back to the page before the quiz once confirmed", () => {
    const fake = fakeWindow([quizList, { ...quiz }]);
    const onLeave = vi.fn();
    const guard = installLeaveGuard(fake.win, 7, onLeave);
    fake.back();
    expect(guard.leaveByHistory()).toBe(true);
    expect(fake.win.location.href).toBe(quizList.href);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("reports when there is no page before the quiz", () => {
    const fake = fakeWindow([{ ...quiz }]);
    const guard = installLeaveGuard(fake.win, 7, () => {});
    fake.back();
    expect(guard.leaveByHistory()).toBe(false);
    expect(fake.win.location.href).toBe(QUIZ);
  });

  it("still goes back without the Navigation API", () => {
    const fake = fakeWindow([quizList, { ...quiz }], { navigationApi: false });
    const guard = installLeaveGuard(fake.win, 7, () => {});
    expect(guard.leaveByHistory()).toBe(true);
    expect(fake.win.location.href).toBe(quizList.href);
  });

  it("leaves Forward to another page alone", () => {
    const leaderboard = {
      state: { __NA: true },
      href: "http://app.test/leaderboard",
    };
    const fake = fakeWindow([
      quizList,
      { ...quiz },
      { state: { ...quiz.state, [GUARD_KEY]: 7 }, href: QUIZ },
      leaderboard,
    ]);
    fake.back(); // Return from the leaderboard to the quiz.
    const onLeave = vi.fn();
    installLeaveGuard(fake.win, 7, onLeave);
    expect(fake.entries).toHaveLength(4);
    fake.win.history.go(1);
    expect(onLeave).not.toHaveBeenCalled();
    expect(fake.win.location.href).toBe(leaderboard.href);
  });

  it("intercepts link clicks before Next.js handles them", () => {
    const fake = fakeWindow([quizList, { ...quiz }]);
    const onLeave = vi.fn();
    installLeaveGuard(fake.win, 7, onLeave);
    const link = anchor("/leaderboard");
    const event = {
      ...click(),
      target: { closest: () => link },
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };
    fake.emit("click", event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(onLeave).toHaveBeenCalledWith({
      kind: "link",
      href: "/leaderboard",
    });
  });

  it("asks before unload until released", () => {
    const fake = fakeWindow([quizList, { ...quiz }]);
    const guard = installLeaveGuard(fake.win, 7, () => {});
    const unload = { preventDefault: vi.fn(), returnValue: undefined };
    fake.emit("beforeunload", unload);
    expect(unload.preventDefault).toHaveBeenCalled();
    expect(unload.returnValue).toBe("");
    guard.release();
    const after = { preventDefault: vi.fn() };
    fake.emit("beforeunload", after);
    expect(after.preventDefault).not.toHaveBeenCalled();
  });

  it("removes every listener on dispose", () => {
    const fake = fakeWindow([quizList, { ...quiz }]);
    installLeaveGuard(fake.win, 7, () => {}).dispose();
    expect(fake.listenerCount()).toBe(0);
  });
});
