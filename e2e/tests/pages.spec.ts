import { test, expect, loginAs, mockURL } from "../support/fixtures";

test.beforeEach(async ({ page }) => {
  await loginAs(page);
});

test("профіль містить дані та улюблені категорії", async ({ page }) => {
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "QuizPlayer", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your level", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Favourite categories" })
      .getByRole("link", { name: "Geography", exact: true }),
  ).toBeVisible();
});

test("leaderboard показує рейтинг гравця та категорії", async ({ page }) => {
  await page.goto("/leaderboard");
  await expect(
    page.getByRole("heading", { name: /^Leaderboard/ }),
  ).toBeVisible();
  await expect(
    page.getByText("QuizPlayer", { exact: true }).first(),
  ).toBeVisible();
  await page.goto("/leaderboard?category=1");
  await expect(
    page.getByText("QuizPlayer", { exact: true }).first(),
  ).toBeVisible();
});

test("achievements чесно показує ще недоступні нагороди", async ({ page }) => {
  await page.goto("/achievements");
  await expect(
    page.getByRole("heading", { name: "Achievements", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Badges unlocked" }),
  ).toHaveAttribute("aria-valuenow", "0");
  await page.getByRole("button", { name: /^Unlocked/ }).click();
  await expect(page.getByRole("status")).toContainText(
    "0 unlocked badges shown",
  );
});

test("backend 500 показує PageState замість падіння", async ({
  page,
  request,
}) => {
  expect(
    (
      await request.post(`${mockURL}/__scenario`, {
        data: { profile: "error500" },
      })
    ).ok(),
  ).toBeTruthy();
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "Profile unavailable", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Your profile could not be loaded. Please try again.",
  );
  await expect(
    page.getByRole("link", { name: "Try again", exact: true }),
  ).toBeVisible();
});
