import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Page, TestInfo } from "@playwright/test";
import type { PageEvidence } from "./types";

export async function capturePageEvidence(page: Page, testInfo: TestInfo, label: string): Promise<PageEvidence> {
  const dir = path.join(testInfo.outputDir, "page-evidence");
  mkdirSync(dir, { recursive: true });

  const safeLabel = label.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
  const screenshotPath = path.join(dir, `${safeLabel}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    url: page.url(),
    screenshotPath,
    title: await page.title(),
    bodyText: (await page.locator("body").innerText()).slice(0, 4000)
  };
}

