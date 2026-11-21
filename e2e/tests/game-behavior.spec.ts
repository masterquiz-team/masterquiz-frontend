import { test, expect, mockURL } from "../support/fixtures";

import { startGame } from "../support/game";

test("неправильна відповідь показує помилку та правильний варіант", async ({
  page,
}) => {
  await startGame(page);
  await page.getByRole("radio", { name: "London", exact: true }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const wrong = page.getByRole("radio", { name: /London/ });
  await expect(wrong).toHaveAccessibleDescription("Incorrect answer");
  await expect(wrong).toBeChecked();
  await expect(wrong).toBeDisabled();
  await expect(
    page.getByRole("radio", { name: /Kyiv/ }),
  ).toHaveAccessibleDescription("Correct answer");
  await expect(
    page.getByRole("status").filter({ hasText: "Answer feedback:" }),
  ).toHaveText("Answer feedback: London: incorrect; Kyiv: correct");
  await expect(
    page.getByText("Kyiv is the capital of Ukraine.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Geography question 2?", exact: true }),
  ).toBeVisible();
});

test("скасування виходу зберігає питання, підтвердження веде до списку", async ({
  page,
  request,
}) => {
  await startGame(page);
  const attemptURL = page.url();
  await page.getByRole("radio", { name: "London", exact: true }).check();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Exit the game?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(attemptURL);
  await expect(
    page.getByRole("radio", { name: "London", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await dialog.getByRole("button", { name: "Yes, exit" }).click();
  await expect(page).toHaveURL(
    "/categories/quizzes?category=1&difficulty=easy&page=0",
  );
  await expect(
    page.getByRole("heading", { name: "Choose a quiz" }),
  ).toBeVisible();
  expect(
    (await (await request.get(`${mockURL}/__state`)).json()).attempts,
  ).toEqual([expect.objectContaining({ status: "IN_PROGRESS" })]);
});

test("ліміт часу завершує квіз із невідповіданими питаннями", async ({
  page,
  request,
}) => {
  // useCountdown uses Date.now, performance.now and setInterval, all controlled by page.clock.
  // The browser expires the whole quiz; finishGame then persists results through the BFF.
  // Avoid animation-frame catch-up when jumping several minutes at once.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await startGame(page);
  await expect(page.getByRole("timer")).toBeVisible();
  // The BFF independently checks server time, outside the browser clock.
  // Age the mock attempt too, so both sides observe an expired deadline.
  expect(
    (
      await request.post(`${mockURL}/__scenario`, {
        data: { attemptClock: "expired" },
      })
    ).ok(),
  ).toBeTruthy();
  await page.clock.fastForward(301_000);
  await page.clock.runFor(1_000);
  await page.clock.resume();
  await expect(
    page.getByRole("heading", { name: "Great job!", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("0 correct", { exact: true })).toBeVisible();
  const answers = page
    .getByRole("complementary", { name: "Your answers" })
    .getByRole("listitem");
  await expect(answers).toHaveCount(10);
  await expect(answers.filter({ hasText: "Skipped." })).toHaveCount(10);
  await expect(page.getByRole("radio")).toHaveCount(0);
  expect(
    (await (await request.get(`${mockURL}/__state`)).json()).attempts,
  ).toEqual([expect.objectContaining({ status: "FINISHED" })]);
});

test("клавіші 1, 2, Enter та Escape керують грою", async ({ page }) => {
  await startGame(page);
  await page.keyboard.press("2");
  await expect(
    page.getByRole("radio", { name: "London", exact: true }),
  ).toBeChecked();
  await page.keyboard.press("1");
  await expect(
    page.getByRole("radio", { name: "Kyiv", exact: true }),
  ).toBeChecked();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Correct!", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Geography question 2?", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  const dialog = page.getByRole("dialog", { name: "Exit the game?" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("Play again після результатів створює нову спробу", async ({
  page,
  request,
}) => {
  await startGame(page);
  const previousURL = page.url();
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
  await page.getByRole("button", { name: "Play again", exact: true }).click();
  await expect(page).not.toHaveURL(previousURL);
  await expect(
    page.getByRole("heading", { name: "Geography question 1?", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("radio", { name: "Kyiv", exact: true }),
  ).not.toBeChecked();
  expect(
    (await (await request.get(`${mockURL}/__state`)).json()).attempts,
  ).toEqual([
    expect.objectContaining({ status: "FINISHED" }),
    expect.objectContaining({ status: "IN_PROGRESS" }),
  ]);
});
