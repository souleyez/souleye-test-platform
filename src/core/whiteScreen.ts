import { expect, type Page } from "@playwright/test";

export async function expectNoWhiteScreen(page: Page, options?: { minBodyTextLength?: number }) {
  const minBodyTextLength = options?.minBodyTextLength ?? 20;

  await expect(page.locator("body")).toBeVisible();

  const bodyText = (await page.locator("body").innerText()).trim();
  expect(bodyText.length, "page should contain visible text").toBeGreaterThan(minBodyTextLength);
  await expect(page.locator("body")).not.toContainText(/is not defined|cannot read|undefined|null|白屏/i);
}

