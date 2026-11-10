import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env["E2E_BASE_URL"] ?? "http://127.0.0.1:5200",
    trace: "retain-on-failure",
    viewport: { width: 1366, height: 768 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } },
    },
  ],
  webServer: process.env["E2E_BASE_URL"]
    ? []
    : {
        command: "pnpm dev",
        url: "http://127.0.0.1:5200",
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
