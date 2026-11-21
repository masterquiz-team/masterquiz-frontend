import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { credentials } from "../mock-backend/fixtures";

export const mockURL = `http://127.0.0.1:${process.env.E2E_BACKEND_PORT ?? "18080"}`;
export const test = base.extend<{ resetMock: void }>({
  resetMock: [
    async ({ request }, use) => {
      const response = await request.post(`${mockURL}/__reset`);
      expect(response.ok()).toBeTruthy();
      await use();
    },
    { auto: true },
  ],
});
export { expect };

export async function fillLogin(
  page: Page,
  email = credentials.email,
  password = credentials.password,
) {
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
}
export async function loginAs(page: Page) {
  await page.goto("/login");
  await fillLogin(page);
  await expect(
    page
      .getByRole("banner")
      .getByRole("link", { name: "Profile", exact: true }),
  ).toBeVisible();
}
export async function startAsGuest(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "Start Playing", exact: true }).click();
  await expect(page).toHaveURL(/\/categories$/);
  await expect(
    page.getByRole("heading", { name: /Pick a category and/ }),
  ).toBeVisible();
}
