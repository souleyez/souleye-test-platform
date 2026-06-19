import { expect, type Page, type TestInfo } from "@playwright/test";
import { capturePageEvidence, expectNoWhiteScreen, judgePageQuality } from "../src";

export async function loginAsAigolfAdmin(page: Page) {
  await page.goto("/");
  await page.getByLabel(/账号|登录名|用户名/).fill("admin");
  await page.getByLabel(/密码/).fill("admin");
  await page.getByRole("button", { name: /登录|进入/ }).click();
  await expect(page.getByText(/运营态势|出发登记|球场列表/)).toBeVisible();
}

export async function verifyAigolfOperationsPage(page: Page, testInfo: TestInfo) {
  await expectNoWhiteScreen(page);
  await expect(page.getByText(/成绩榜|球速榜/)).toBeVisible();

  const evidence = await capturePageEvidence(page, testInfo, "aigolf-operations-status");
  await judgePageQuality(testInfo, "AIGOLF 运营态势地图", evidence, {
    expectedContent: [/运营态势|成绩榜|球速榜/, /球童|客户|事件|当前洞/]
  });
}

