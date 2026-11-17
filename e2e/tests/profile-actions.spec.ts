import { test, expect, loginAs, fillLogin, mockURL } from "../support/fixtures";

test.beforeEach(async ({ page }) => {
  await loginAs(page);
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "QuizPlayer", exact: true }),
  ).toBeVisible();
});

test("нове ім’я зберігається у профілі та mock", async ({ page, request }) => {
  await page.getByRole("button", { name: "Edit profile" }).click();
  await page.getByLabel("Username", { exact: true }).fill("UpdatedPlayer");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Your username was updated.",
  );
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "UpdatedPlayer", exact: true }),
  ).toBeVisible();
  expect(
    (await (await request.get(`${mockURL}/__state`)).json()).users[0].nickname,
  ).toBe("UpdatedPlayer");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "UpdatedPlayer", exact: true }),
  ).toBeVisible();
});

test("невалідне ім’я показує помилку", async ({ page, request }) => {
  await page.getByRole("button", { name: "Edit profile" }).click();
  for (const [value, message] of [
    ["   ", "This field is required."],
    ["!!!", "Use at least one letter or digit."],
    ["a".repeat(51), "Use at most 50 characters."],
  ]) {
    await page.getByLabel("Username", { exact: true }).fill(value);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(message, { exact: true })).toBeVisible();
  }
  expect(
    (await (await request.get(`${mockURL}/__state`)).json()).users[0].nickname,
  ).toBe("QuizPlayer");
});

test("помилка backend залишає старе ім’я", async ({ page, request }) => {
  expect(
    (
      await request.post(`${mockURL}/__scenario`, {
        data: { profileUpdate: "error500" },
      })
    ).ok(),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Edit profile" }).click();
  await page.getByLabel("Username", { exact: true }).fill("UnsavedPlayer");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("dialog", { name: "Edit profile" }).getByRole("alert"),
  ).toHaveText(
    "The account service could not complete this request. Please try again.",
  );
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "QuizPlayer", exact: true }),
  ).toBeVisible();
  expect(
    (await (await request.get(`${mockURL}/__state`)).json()).users[0].nickname,
  ).toBe("QuizPlayer");
});

test("аватар зберігається, закриття без збереження нічого не змінює", async ({
  page,
  request,
}) => {
  // ProfileAvatar is decorative (alt=""); scope the image to the named profile section.
  const avatar = page
    .getByRole("region", { name: "QuizPlayer" })
    .locator('img[width="200"]');
  await expect(avatar).toHaveAttribute("src", "/api/profile/avatar?n=1");
  await page.getByRole("button", { name: "Change avatar" }).click();
  let picker = page.getByRole("dialog", { name: "Choose your avatar" });
  await picker.getByRole("img", { name: "Avatar 2", exact: true }).click();
  await expect(
    picker.getByRole("radio", { name: "Avatar 2", exact: true }),
  ).toBeChecked();
  await picker.getByRole("button", { name: "Save", exact: true }).click();
  await expect(picker).toBeHidden();
  await expect(avatar).toHaveAttribute("src", "/api/profile/avatar?n=2");
  await page.getByRole("button", { name: "Change avatar" }).click();
  picker = page.getByRole("dialog", { name: "Choose your avatar" });
  await picker.getByRole("img", { name: "Avatar 3", exact: true }).click();
  await expect(
    picker.getByRole("radio", { name: "Avatar 3", exact: true }),
  ).toBeChecked();
  await picker.getByRole("button", { name: "Close", exact: true }).click();
  await expect(picker).toBeHidden();
  await expect(avatar).toHaveAttribute("src", "/api/profile/avatar?n=2");
  expect(
    (await (await request.get(`${mockURL}/__state`)).json()).users[0].avatarId,
  ).toBe("avatar-2");
  await page.reload();
  await expect(avatar).toHaveAttribute("src", "/api/profile/avatar?n=2");
});

test("скасування видалення зберігає сесію, підтвердження видаляє акаунт", async ({
  page,
  request,
}) => {
  await page.getByRole("button", { name: "Edit profile" }).click();
  await page
    .getByRole("button", { name: "Delete account", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Delete your account?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page
      .getByRole("banner")
      .getByRole("link", { name: "Profile", exact: true }),
  ).toBeVisible();
  expect(
    (await (await request.get(`${mockURL}/__state`)).json()).users,
  ).toHaveLength(1);
  await page
    .getByRole("button", { name: "Delete account", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Log in", exact: true }),
  ).toBeVisible();
  expect(
    (await (await request.get(`${mockURL}/__state`)).json()).users,
  ).toHaveLength(0);
  await page.goto("/login");
  await fillLogin(page);
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Incorrect email or password. Please try again.",
  );
});
