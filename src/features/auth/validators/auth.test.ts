import { describe, expect, it } from "vitest";
import { validateAuthValues } from "./auth";

const valid = {
  email: "ada@example.com",
  password: "password",
  nickname: "Ada",
  repeatPassword: "password",
};

describe("validateAuthValues", () => {
  it.each(["login", "register"] as const)(
    "requires email and password in %s",
    (mode) => {
      expect(
        validateAuthValues(mode, { ...valid, email: " ", password: "" }),
      ).toMatchObject({
        email: "This field is required.",
        password: "This field is required.",
      });
    },
  );
  it("uses the exact email format message", () => {
    expect(
      validateAuthValues("login", { ...valid, email: "invalid" }).email,
    ).toBe("Please enter a valid email address.");
  });
  it("requires confirmation and distinguishes short passwords from empty ones", () => {
    expect(
      validateAuthValues("register", {
        ...valid,
        password: "short",
        repeatPassword: "",
      }),
    ).toMatchObject({
      password: "Password must be at least 8 characters.",
      repeatPassword: "This field is required.",
    });
  });
  it("keeps mismatch and nickname rules", () => {
    expect(
      validateAuthValues("register", {
        ...valid,
        nickname: "",
        repeatPassword: "different",
      }),
    ).toMatchObject({
      nickname: "Enter your username.",
      repeatPassword: "Passwords must match.",
    });
  });
  it.each(["login", "register"] as const)("accepts valid %s values", (mode) => {
    expect(validateAuthValues(mode, valid)).toEqual({});
  });
});
