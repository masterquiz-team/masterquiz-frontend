import { test, expect } from "../support/fixtures";

test("@mobile header дозволяє переходити між сторінками", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  await expect(header).toBeVisible();
  await header.getByRole("link", { name: "Categories", exact: true }).click();
  await expect(page).toHaveURL("/categories");
  await header.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page).toHaveURL("/");
  await header.getByRole("link", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL("/login");
});
