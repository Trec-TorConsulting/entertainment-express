import { defineConfig, devices } from "@playwright/test";
import fs from "fs";
import path from "path";

// Load .env.e2e if present
const envPath = path.resolve(__dirname, ".env.e2e");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      if (key && !(key in process.env)) {
        process.env[key.trim()] = vals.join("=").trim();
      }
    }
  }
}

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/support/global-setup.ts",
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "api",
      testMatch: /06-api\/.*\.spec\.ts/,
    },
    {
      name: "owner",
      testMatch: /01-owner\/.*\.spec\.ts/,
    },
    {
      name: "employee",
      testMatch: /02-employee\/.*\.spec\.ts/,
    },
    {
      name: "client",
      testMatch: /03-client\/.*\.spec\.ts/,
    },
    {
      name: "public",
      testMatch: /04-public\/.*\.spec\.ts/,
    },
    {
      name: "workflows",
      testMatch: /05-workflows\/.*\.spec\.ts/,
    },
  ],
});
