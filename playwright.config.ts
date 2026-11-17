import { defineConfig, devices } from "@playwright/test";

const backendPort = process.env.E2E_BACKEND_PORT ?? "18080";
const appPort = process.env.E2E_APP_PORT ?? "13100";
const backendURL = `http://127.0.0.1:${backendPort}`;
const appURL = `http://127.0.0.1:${appPort}`;

export default defineConfig({
  testDir: "e2e/tests",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }], ["github"]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: appURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      grepInvert: /@mobile/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      grep: /@mobile/,
      use: { ...devices["Pixel 7"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: [
    {
      command: "node e2e/mock-backend/server.ts",
      url: `${backendURL}/__health`,
      env: { MOCK_BACKEND_PORT: backendPort },
      reuseExistingServer: false,
    },
    {
      command: `pnpm build && pnpm start -p ${appPort}`,
      url: appURL,
      env: {
        BACKEND_API_URL: backendURL,
        APP_ORIGIN: appURL,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
  ],
});
