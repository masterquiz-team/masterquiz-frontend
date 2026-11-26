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

test("achievements показує відкриті бейджі з бекенду", async ({ page }) => {
  await page.goto("/achievements");
  await expect(
    page.getByRole("heading", { name: "Achievements", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Badges unlocked" }),
  ).toHaveAttribute("aria-valuenow", "1");
  await expect(
    page.getByRole("heading", { name: "1 of 8 badges unlocked" }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Quiz Veteran progress" }),
  ).toHaveAttribute("aria-valuenow", "2");
  await page.getByRole("button", { name: "Unlocked (1)" }).click();
  await expect(page.getByRole("status")).toContainText(
    "1 unlocked badges shown",
  );
  const card = page.getByRole("listitem").filter({ hasText: "First Steps" });
  await expect(card).toContainText("Unlocked");
});

test("профіль показує відкритий бейдж без замка", async ({ page }) => {
  await page.goto("/profile");
  const badges = page.getByRole("region", { name: "Your badges" });
  await expect(
    badges.getByRole("listitem").filter({ hasText: "First steps" }),
  ).not.toContainText("Locked");
  await expect(
    badges.getByRole("listitem").filter({ hasText: "Perfect Score" }),
  ).toContainText("Locked");
});

test("збій бейджів не ламає профіль", async ({ page, request }) => {
  expect(
    (
      await request.post(`${mockURL}/__scenario`, {
        data: { "user-achievements": "error500" },
      })
    ).ok(),
  ).toBeTruthy();
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "Your level", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Badges could not be loaded.")).toBeVisible();
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
