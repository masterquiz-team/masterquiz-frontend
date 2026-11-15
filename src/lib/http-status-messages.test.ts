import { describe, expect, it } from "vitest";
import { getHttpStatusMessage } from "./http-status-messages";

describe("getHttpStatusMessage", () => {
  const messages = { fallback: "Try again.", statuses: { 404: "Missing." } };
  it("uses the status message or the fallback", () => {
    expect(getHttpStatusMessage(404, messages)).toBe("Missing.");
    expect(getHttpStatusMessage(500, messages)).toBe("Try again.");
    expect(getHttpStatusMessage(undefined, messages)).toBe("Try again.");
  });
});
