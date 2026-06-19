import { expect, test } from "@playwright/test";
import { capturePageEvidence, expectNoWhiteScreen, judgePageQuality } from "../../src";

test("platform helpers can inspect a non-empty page", async ({ page }, testInfo) => {
  await page.setContent(`
    <main>
      <h1>运营态势</h1>
      <section>地图已加载，业务区域可见</section>
      <section>成绩榜</section>
      <section>球速榜</section>
    </main>
  `);

  await expectNoWhiteScreen(page);
  const evidence = await capturePageEvidence(page, testInfo, "platform-smoke");
  await judgePageQuality(testInfo, "platform-smoke", evidence, {
    mode: "warn",
    expectedContent: [/运营态势/, /成绩榜/, /球速榜/]
  });

  expect(evidence.bodyText).toContain("运营态势");
});
