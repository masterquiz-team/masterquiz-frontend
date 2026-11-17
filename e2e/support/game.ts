import type { Page } from "@playwright/test";
import { expect, loginAs, startAsGuest } from "./fixtures";

export async function startGame(page: Page, member = false) {
  if (member) {
    await loginAs(page);
    await page
      .getByRole("banner")
      .getByRole("link", { name: "Categories", exact: true })
      .click();
  } else {
    await startAsGuest(page);
  }
  await page.getByRole("link", { name: /^Geography/ }).click();
  await page
    .getByRole("link", { name: "Easy: 10 questions, about 5 minutes" })
    .click();
  await page.getByRole("button", { name: /Random Quiz/ }).click();
  await expect(
    page.getByRole("heading", { name: "Geography question 1?", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
}
