import { expect, it } from "vitest";
import {
  GUEST_PLAY_UNAVAILABLE,
  accountRequiredMessage,
} from "@/features/auth/guest-access";
import { GuestAccessError } from "./errors";

it("explains that guest access requires a registered account", () => {
  const error = new GuestAccessError();

  expect(error.message).toBe(accountRequiredMessage);
  expect(accountRequiredMessage).toBe(
    "This needs a registered account. Register or log in to continue.",
  );
  expect(error.code).toBe(GUEST_PLAY_UNAVAILABLE);
  expect(error.status).toBe(403);
});
