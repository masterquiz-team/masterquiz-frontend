import { test, expect, startAsGuest } from "../support/fixtures";

for (const kind of ["random", "chosen"] as const) {
  test(`гість проходить ${kind} quiz і бачить бали`, async ({ page }) => {
    await startAsGuest(page);
    await page.getByRole("link", { name: /^Geography/ }).click();
    await page
      .getByRole("link", { name: "Easy: 10 questions, about 5 minutes" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Choose a quiz" }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: kind === "random" ? /Random Quiz/ : /World capitals/,
      })
      .click();
    for (let i = 1; i <= 10; i++) {
      await expect(
        page.getByRole("heading", {
          name: `Geography question ${i}?`,
          exact: true,
        }),
      ).toBeVisible();
      await page.getByRole("radio", { name: /Kyiv/ }).check();
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
    // CountUp has separate visual and screen-reader digits. Check the
    // accessible score so duplicated DOM text does not affect the assertion.
    await expect(page.getByRole("definition").filter({ hasText: "10 correct" }))
      .toMatchAriaSnapshot(`
      - definition:
        - strong: 100 /100
        - text: 10 correct
    `);
    await expect(page.getByText("10 correct", { exact: true })).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Great job!", exact: true }),
    ).toBeVisible();
    // CountUp has separate visual and screen-reader digits. Check the
    // accessible score so duplicated DOM text does not affect the assertion.
    await expect(page.getByRole("definition").filter({ hasText: "10 correct" }))
      .toMatchAriaSnapshot(`
      - definition:
        - strong: 100 /100
        - text: 10 correct
    `);
  });
}

test("гість на member-only сторінці переходить до реєстрації", async ({
  page,
}) => {
  await startAsGuest(page);
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/register\?next=%2Fprofile$/);
  await expect(
    page.getByRole("button", { name: "Create an account" }),
  ).toBeVisible();
});
