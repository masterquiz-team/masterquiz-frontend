import { describe, expect, it } from "vitest";
import { getAuthFieldState } from "./field-state";
import { emptyAuthValues } from "./form";

const valid = {
  email: "ada@example.com",
  password: "password",
  nickname: "Ada",
  repeatPassword: "password",
};

describe("getAuthFieldState", () => {
  it("leaves untouched fields neutral, even when populated or invalid", () => {
    for (const values of [emptyAuthValues, valid, { ...valid, email: "bad" }]) {
      const { errors, statuses } = getAuthFieldState(
        "login",
        values,
        {},
        false,
        {},
      );
      expect(errors).toEqual({});
      expect(statuses).toEqual({ email: "idle", password: "idle" });
    }
  });
  it("validates only the blurred field and updates its state on edits", () => {
    expect(
      getAuthFieldState("login", emptyAuthValues, { email: true }, false, {})
        .statuses,
    ).toEqual({ email: "invalid", password: "idle" });
    expect(
      getAuthFieldState("register", valid, { email: true }, false, {}).statuses
        .email,
    ).toBe("valid");
    expect(
      getAuthFieldState(
        "login",
        { ...valid, email: "bad" },
        { email: true },
        false,
        {},
      ).errors.email,
    ).toBe("Please enter a valid email address.");
  });
  it("shows all errors after submit and revalidates on change", () => {
    expect(
      getAuthFieldState("login", emptyAuthValues, {}, true, {}).statuses,
    ).toEqual({ email: "invalid", password: "invalid" });
    expect(getAuthFieldState("login", valid, {}, true, {}).statuses).toEqual({
      email: "idle",
      password: "idle",
    });
  });
  it("gives server errors priority and restores client state when cleared on edit", () => {
    expect(
      getAuthFieldState("register", valid, {}, true, { email: "Taken" }),
    ).toMatchObject({
      errors: { email: "Taken" },
      statuses: { email: "invalid" },
    });
    expect(
      getAuthFieldState("register", valid, {}, true, {}).statuses.email,
    ).toBe("valid");
  });
  it("keeps confirmation invalid until matching and rechecks when the password changes", () => {
    expect(
      getAuthFieldState("register", valid, { repeatPassword: true }, false, {})
        .statuses.repeatPassword,
    ).toBe("valid");
    expect(
      getAuthFieldState(
        "register",
        { ...valid, password: "different" },
        { repeatPassword: true },
        false,
        {},
      ).errors.repeatPassword,
    ).toBe("Passwords must match.");
    expect(
      getAuthFieldState(
        "register",
        { ...valid, password: "different", repeatPassword: "different" },
        { repeatPassword: true },
        false,
        {},
      ),
    ).toMatchObject({
      errors: {},
      statuses: { repeatPassword: "valid", password: "idle" },
    });
    expect(
      getAuthFieldState(
        "register",
        emptyAuthValues,
        { repeatPassword: true },
        false,
        {},
      ).statuses.repeatPassword,
    ).toBe("invalid");
  });
  it("never marks login fields valid, since only the server can check them", () => {
    const state = getAuthFieldState(
      "login",
      valid,
      { email: true, password: true },
      true,
      {},
    );
    expect(state.statuses).toEqual({ email: "idle", password: "idle" });
    expect(
      getAuthFieldState("login", { ...valid, password: "" }, {}, true, {})
        .statuses.password,
    ).toBe("invalid");
    expect(
      getAuthFieldState("register", valid, { password: true }, false, {})
        .statuses.password,
    ).toBe("valid");
  });
});
