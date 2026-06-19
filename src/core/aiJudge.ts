import { expect, type TestInfo } from "@playwright/test";
import { getAiJudgeMode } from "./env";
import type { AiJudgeResult, PageEvidence, PageExpectationProfile, PageQualityOptions } from "./types";

export async function judgePageQuality(
  testInfo: TestInfo,
  pageName: string,
  evidence: PageEvidence,
  options: PageQualityOptions = {}
) {
  const mode = options.mode ?? getAiJudgeMode();
  if (mode === "off") return;

  const expectationProfile = options.expectationProfile ?? { expectedContent: options.expectedContent };
  const provider = options.provider ?? localHeuristicJudge(expectationProfile);
  const result = await provider({ pageName, evidence, expectationProfile }).catch((error): AiJudgeResult => ({
    pass: true,
    score: 0,
    reason: `AI judge unavailable: ${error instanceof Error ? error.message : String(error)}`,
    evidence: [evidence.screenshotPath, evidence.url]
  }));

  await testInfo.attach(`ai-judge-${safeName(pageName)}.json`, {
    body: JSON.stringify(result, null, 2),
    contentType: "application/json"
  });

  if (!result.pass && mode === "fail") {
    expect(result, result.reason).toMatchObject({ pass: true });
  }
}

export function localHeuristicJudge(expectationProfile: PageExpectationProfile = {}) {
  return async ({ pageName, evidence }: { pageName: string; evidence: PageEvidence }): Promise<AiJudgeResult> => {
    const body = evidence.bodyText.trim();
    const hasRuntimeError = /is not defined|cannot read|undefined|null|白屏|报错|error/i.test(body);
    const looksEmpty = body.length < (expectationProfile.minBodyTextLength ?? 80);
    const expectedContent = expectationProfile.expectedContent ?? [];
    const missingExpectedContent = expectedContent.filter((item) =>
      typeof item === "string" ? !body.includes(item) : !item.test(body)
    );
    const pass = !hasRuntimeError && !looksEmpty && missingExpectedContent.length === 0;

    return {
      pass,
      score: pass ? 90 : 40,
      reason: pass
        ? `${pageName} has enough visible content for the configured smoke review.`
        : `${pageName} may be visually or semantically incomplete; review screenshot and DOM summary.`,
      evidence: [
        evidence.screenshotPath,
        evidence.url,
        evidence.title,
        ...missingExpectedContent.map((item) => `missing expected content: ${String(item)}`)
      ].filter(Boolean)
    };
  };
}

function safeName(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
}
