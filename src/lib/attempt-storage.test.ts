import { expect, it, vi } from "vitest";
import { clearSavedAttempts } from "./attempt-storage";

// Next supplies this import guard; the unit test supplies the browser boundary.
vi.mock("client-only", () => ({}));

it("removes all saved attempts while preserving unrelated storage", () => {
  const storage: Record<string, unknown> = {
    "masterquiz-attempt:1": "first",
    "masterquiz-attempt:2": "second",
    theme: "dark",
    "masterquiz-attempt": "unrelated",
  };
  const removeItem = vi.fn((key: string) => {
    delete storage[key];
  });
  Object.defineProperty(storage, "removeItem", { value: removeItem });
  vi.stubGlobal("window", { sessionStorage: storage });
  clearSavedAttempts();
  expect(Object.keys(storage)).toEqual(["theme", "masterquiz-attempt"]);
  expect(removeItem.mock.calls).toEqual([
    ["masterquiz-attempt:1"],
    ["masterquiz-attempt:2"],
  ]);
});

it("tolerates blocked browser storage", () => {
  vi.stubGlobal("window", {
    get sessionStorage() {
      throw new DOMException("Blocked", "SecurityError");
    },
  });
  expect(() => clearSavedAttempts()).not.toThrow();
});

it("tolerates storage removal failures", () => {
  const removeItem = vi.fn(() => {
    throw new DOMException("Blocked", "SecurityError");
  });
  vi.stubGlobal("window", {
    sessionStorage: { "masterquiz-attempt:1": "saved", removeItem },
  });
  expect(() => clearSavedAttempts()).not.toThrow();
  expect(removeItem).toHaveBeenCalledWith("masterquiz-attempt:1");
});
