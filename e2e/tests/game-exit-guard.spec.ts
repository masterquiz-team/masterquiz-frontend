import type { Page } from "@playwright/test";
import { test, expect, mockURL } from "../support/fixtures";
import { startGame } from "../support/game";

const quizList = "/categories/quizzes?category=1&difficulty=easy&page=0";
const exitDialog = (page: Page) =>
  page.getByRole("dialog", { name: "Exit the game?" });
const headerLink = (page: Page, name: string) =>
  page.getByRole("banner").getByRole("link", { name, exact: true });

async function finishGame(page: Page) {
  for (let i = 1; i <= 10; i++) {
    await expect(
      page.getByRole("heading", {
        name: `Geography question ${i}?`,
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("radio", { name: "Kyiv", exact: true }).check();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Correct!", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: i === 10 ? "Finish quiz" : "Next question",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Great job!", exact: true }),
  ).toBeVisible();
}

test("Leaderboard: скасування зберігає вибір, підтвердження відкриває рейтинг", async ({
  page,
}) => {
  await startGame(page, true);
  const attemptURL = page.url();
  const answer = page.getByRole("radio", { name: "London", exact: true });
  await answer.check();
  await headerLink(page, "Leaderboard").click();
  await expect(exitDialog(page)).toBeVisible();
  await expect(page).toHaveURL(attemptURL);
  await exitDialog(page)
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(exitDialog(page)).toBeHidden();
  await expect(page).toHaveURL(attemptURL);
  await expect(
    page.getByRole("heading", { name: "Geography question 1?", exact: true }),
  ).toBeVisible();
  await expect(answer).toBeChecked();
  await headerLink(page, "Leaderboard").click();
  await exitDialog(page).getByRole("button", { name: "Yes, exit" }).click();
  await expect(page).toHaveURL("/leaderboard");
});

for (const [name, destination] of [
  ["MasterQuiz", "/"],
  ["Home", "/"],
  ["Categories", "/categories"],
  ["About", "/#about"],
  ["Profile", "/profile"],
]) {
  test(`${name}: підтвердження виходу відкриває вибране посилання`, async ({
    page,
  }) => {
    await startGame(page, name === "Profile");
    const attemptURL = page.url();
    await headerLink(page, name).click();
    await expect(exitDialog(page)).toBeVisible();
    await expect(page).toHaveURL(attemptURL);
    await exitDialog(page).getByRole("button", { name: "Yes, exit" }).click();
    await expect(page).toHaveURL(destination);
    await expect(exitDialog(page)).toBeHidden();
  });
}

test("Ctrl/Meta-клік відкриває посилання окремо без діалогу виходу", async ({
  page,
  context,
}) => {
  await startGame(page);
  const attemptURL = page.url();
  const newPage = context.waitForEvent("page");
  await headerLink(page, "Categories").click({ modifiers: ["ControlOrMeta"] });
  const tab = await newPage;
  try {
    await expect(tab).toHaveURL("/categories");
    await expect(page).toHaveURL(attemptURL);
    await expect(exitDialog(page)).toBeHidden();
  } finally {
    await tab.close();
  }
});

test("Back утримує квіз, повторний Back зберігає діалог, Escape скасовує вихід", async ({
  page,
  request,
}) => {
  await startGame(page);
  const attemptURL = page.url();
  const answer = page.getByRole("radio", { name: "London", exact: true });
  await answer.check();
  await page.goBack();
  await expect(exitDialog(page)).toBeVisible();
  await expect(page).toHaveURL(attemptURL);
  await page.goBack();
  await expect(exitDialog(page)).toBeVisible();
  await expect(page).toHaveURL(attemptURL);
  await page.keyboard.press("Escape");
  await expect(exitDialog(page)).toBeHidden();
  await expect(answer).toBeChecked();
  await expect(page).toHaveURL(attemptURL);
  await page.goBack();
  await expect(exitDialog(page)).toBeVisible();
  await exitDialog(page).getByRole("button", { name: "Yes, exit" }).click();
  await expect(page).toHaveURL(quizList);
  await expect(
    page.getByRole("heading", { name: "Choose a quiz" }),
  ).toBeVisible();
  expect(
    (await (await request.get(`${mockURL}/__state`)).json()).attempts,
  ).toEqual([expect.objectContaining({ status: "IN_PROGRESS" })]);
});

test("reload показує beforeunload, після оновлення Back повертає до списку через діалог", async ({
  page,
}) => {
  await startGame(page);
  const attemptURL = page.url();
  // Взаємодія користувача потрібна для нативного beforeunload.
  await page.getByRole("radio", { name: "London", exact: true }).check();
  const prompt = page.waitForEvent("dialog");
  const reload = page.reload();
  const dialog = await prompt;
  const type = dialog.type();
  await dialog.accept();
  await reload;
  expect(type).toBe("beforeunload");
  await expect(
    page.getByRole("heading", { name: "Geography question 1?", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(exitDialog(page)).toBeVisible();
  await expect(page).toHaveURL(attemptURL);
  await exitDialog(page).getByRole("button", { name: "Yes, exit" }).click();
  await expect(page).toHaveURL(quizList);
});

test("під час feedback посилання також потребує підтвердження виходу", async ({
  page,
}) => {
  await startGame(page);
  await page.getByRole("radio", { name: "Kyiv", exact: true }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Correct!", exact: true }),
  ).toBeVisible();
  const attemptURL = page.url();
  await headerLink(page, "Categories").click();
  await expect(exitDialog(page)).toBeVisible();
  await exitDialog(page)
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(exitDialog(page)).toBeHidden();
  await expect(page).toHaveURL(attemptURL);
  await expect(
    page.getByRole("heading", { name: "Correct!", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Kyiv", { exact: true })).toBeVisible();
  await expect(
    page.getByText("1/10 answers saved", { exact: false }),
  ).toBeVisible();
});

test("після результатів один Back повертає до списку без діалогу", async ({
  page,
}) => {
  await startGame(page);
  await finishGame(page);
  await page.goBack();
  await expect(page).toHaveURL(quizList);
  await expect(exitDialog(page)).toBeHidden();
});

test("після результатів посилання шапки переходить без діалогу", async ({
  page,
}) => {
  await startGame(page);
  await finishGame(page);
  await headerLink(page, "Categories").click();
  await expect(page).toHaveURL("/categories");
  await expect(exitDialog(page)).toBeHidden();
});
