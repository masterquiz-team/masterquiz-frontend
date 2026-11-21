import { test, expect, loginAs } from "../support/fixtures";

test("фільтр категорій змінює URL і рейтинг, All categories відновлює загальний список", async ({
  page,
}) => {
  await loginAs(page);
  await page.goto("/leaderboard");
  const rankings = page.getByRole("region", { name: "Rankings" });
  const category = rankings.getByRole("combobox", {
    name: "Category",
    exact: true,
  });
  const rows = rankings.getByRole("row");
  await expect(category).toHaveValue("");
  await expect(
    rankings.getByRole("columnheader", { name: "Total score", exact: true }),
  ).toBeVisible();
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1).getByRole("cell")).toHaveText([
    "1",
    "QuizPlayer",
    "100",
    "2",
  ]);
  await category.selectOption({ label: "History" });
  await expect(page).toHaveURL("/leaderboard?category=2");
  await expect(category).toHaveValue("2");
  await expect(
    rankings.getByRole("columnheader", { name: "Category score", exact: true }),
  ).toBeVisible();
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1).getByRole("cell")).toHaveText([
    "1",
    "HistoryChampion",
    "240",
    "2",
  ]);
  await expect(
    rankings.getByRole("cell", { name: "QuizPlayer", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "History", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "All categories", exact: true })
    .click();
  await expect(page).toHaveURL("/leaderboard");
  await expect(category).toHaveValue("");
  await expect(
    rankings.getByRole("columnheader", { name: "Total score", exact: true }),
  ).toBeVisible();
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1).getByRole("cell")).toHaveText([
    "1",
    "QuizPlayer",
    "100",
    "2",
  ]);
  await expect(
    page.getByRole("button", { name: "All categories", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
