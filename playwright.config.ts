import { defineConfig, devices } from "@playwright/test";
import { getBaseUrl } from "./src/core/env";

const aiProvider = (process.env.PC_E2E_AI_PROVIDER || process.env.E2E_AI_PROVIDER || "heuristic").toLowerCase();
const usesRemoteAiJudge = aiProvider !== "heuristic";
const usesVisionJudge = process.env.PC_E2E_AI_VISION === "1" || process.env.E2E_AI_VISION === "1";

export default defineConfig({
  testDir: "./tests",
  timeout: usesVisionJudge ? 420_000 : usesRemoteAiJudge ? 180_000 : 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "outputs/playwright-report", open: "never" }]
  ],
  use: {
    baseURL: getBaseUrl(),
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  outputDir: "outputs/playwright-artifacts"
});
