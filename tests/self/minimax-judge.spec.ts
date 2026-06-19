import { writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { minimaxJudge } from "../../src";

test("MiniMax judge uses OpenAI-compatible chat completions", async () => {
  const requests: Array<{ url: string; body: any; authorization?: string | null }> = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (url, init) => {
    requests.push({
      url: String(url),
      body: JSON.parse(String(init?.body)),
      authorization: init?.headers instanceof Headers
        ? init.headers.get("Authorization")
        : (init?.headers as Record<string, string> | undefined)?.Authorization
    });

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                pass: true,
                score: 92,
                reason: "页面主体内容完整。",
                evidence: ["运营态势", "事件清单"]
              })
            }
          }
        ]
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }) as typeof fetch;

  try {
    const provider = minimaxJudge(
      { expectedContent: ["运营态势"], minBodyTextLength: 20 },
      {
        MINIMAX_API_KEY: "test-key",
        MINIMAX_BASE_URL: "https://api.minimax.io/v1",
        MINIMAX_MODEL: "MiniMax-M3"
      }
    );

    const result = await provider({
      pageName: "运营态势",
      expectationProfile: { expectedContent: ["运营态势"], minBodyTextLength: 20 },
      evidence: {
        url: "https://sd.goods-editor.com/admin/?token=secret",
        title: "AIGOLF",
        screenshotPath: "outputs/example.png",
        bodyText: "运营态势 事件清单 成绩排行榜"
      }
    });

    expect(result).toMatchObject({ pass: true, score: 92 });
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe("https://api.minimax.io/v1/chat/completions");
    expect(requests[0].authorization).toBe("Bearer test-key");
    expect(requests[0].body.model).toBe("MiniMax-M3");
    expect(JSON.stringify(requests[0].body)).not.toContain("token=secret");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("MiniMax judge can include screenshot vision input", async ({}, testInfo) => {
  const requests: Array<{ body: any }> = [];
  const originalFetch = globalThis.fetch;
  const screenshotPath = testInfo.outputPath("sample.png");
  writeFileSync(
    screenshotPath,
    Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l3q7WQAAAABJRU5ErkJggg==", "base64")
  );

  globalThis.fetch = (async (_url, init) => {
    requests.push({ body: JSON.parse(String(init?.body)) });

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                pass: true,
                score: 95,
                reason: "截图和页面文本均正常。",
                evidence: ["visual screenshot reviewed"]
              })
            }
          }
        ]
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }) as typeof fetch;

  try {
    const provider = minimaxJudge(
      { expectedContent: ["运营态势"] },
      {
        MINIMAX_API_KEY: "test-key",
        MINIMAX_BASE_URL: "https://api.minimax.io/v1",
        MINIMAX_MODEL: "MiniMax-M3",
        E2E_AI_VISION: "1"
      }
    );

    await provider({
      pageName: "运营态势",
      expectationProfile: { expectedContent: ["运营态势"] },
      evidence: {
        url: "https://sd.goods-editor.com/admin/?token=secret",
        title: "AIGOLF",
        screenshotPath,
        bodyText: "运营态势 事件清单 成绩排行榜"
      }
    });

    const content = requests[0].body.messages[1].content;
    expect(Array.isArray(content)).toBe(true);
    expect(content[0]).toMatchObject({ type: "text" });
    expect(content[1].type).toBe("image_url");
    expect(content[1].image_url.url).toContain("data:image/png;base64,");
    expect(JSON.stringify(content)).not.toContain("token=secret");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
