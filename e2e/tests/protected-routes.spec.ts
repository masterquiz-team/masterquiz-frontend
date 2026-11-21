import { test, expect, fillLogin } from "../support/fixtures";

for (const path of [
  "/profile",
  "/achievements",
  "/leaderboard",
  "/leaderboard?category=1",
]) {
  test(`анонімний ${path} повертається на початкову сторінку після входу`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page).toHaveURL(
      `/login?${new URLSearchParams({ next: path })}`,
    );
    await expect(
      page.getByRole("button", { name: "Log in", exact: true }),
    ).toBeVisible();
    await fillLogin(page);
    await expect(page).toHaveURL(path);
    await expect(
      page
        .getByRole("banner")
        .getByRole("link", { name: "Profile", exact: true }),
    ).toBeVisible();
  });
}
