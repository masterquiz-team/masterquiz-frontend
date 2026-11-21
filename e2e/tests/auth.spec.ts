import {
  test,
  expect,
  fillLogin,
  loginAs,
  mockURL,
  startAsGuest,
} from "../support/fixtures";

async function register(page: import("@playwright/test").Page) {
  await page.goto("/register");
  await page.getByLabel("Email address").fill("new@example.com");
  await page.getByLabel("Username", { exact: true }).fill("NewPlayer");
  await page.getByLabel("Password", { exact: true }).fill("Password123!");
  await page
    .getByLabel("Repeat password", { exact: true })
    .fill("Password123!");
  await page.getByRole("button", { name: "Create an account" }).click();
}

test("реєстрація гостя зберігає автентифікацію", async ({ page }) => {
  await startAsGuest(page);
  await register(page);
  await expect(page).toHaveURL("/");
  await expect(
    page
      .getByRole("banner")
      .getByRole("link", { name: "Profile", exact: true }),
  ).toBeVisible();
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "NewPlayer", exact: true }),
  ).toBeVisible();
});

test("нова реєстрація веде на логін, після чого можна увійти", async ({
  page,
}) => {
  await register(page);
  await expect(page).toHaveURL("/login?registered=1");
  await expect(page.getByRole("status")).toHaveText(
    "Your account was created. You can now log in.",
  );
  await fillLogin(page, "new@example.com", "Password123!");
  await expect(
    page
      .getByRole("banner")
      .getByRole("link", { name: "Profile", exact: true }),
  ).toBeVisible();
});

test("правильні облікові дані та вихід", async ({ page }) => {
  await loginAs(page);
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Profile", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "QuizPlayer", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Log in", exact: true }),
  ).toBeVisible();
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login\?next=%2Fprofile$/);
});

test("відхилені credentials показують повідомлення", async ({
  page,
  request,
}) => {
  expect(
    (
      await request.post(`${mockURL}/__scenario`, {
        data: { login: "invalid-credentials" },
      })
    ).ok(),
  ).toBeTruthy();
  await page.goto("/login");
  await fillLogin(page);
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Incorrect email or password. Please try again.",
  );
});

test("порожні й невалідні поля перевіряються клієнтом", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(
    page.getByText("This field is required.", { exact: true }),
  ).toHaveCount(4);
  await page.getByLabel("Email address").fill("invalid");
  await page.getByLabel("Username", { exact: true }).fill("NewPlayer");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Repeat password", { exact: true }).fill("different");
  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(
    page.getByText("Please enter a valid email address.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Password must be at least 8 characters.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Passwords must match.", { exact: true }),
  ).toBeVisible();
});
