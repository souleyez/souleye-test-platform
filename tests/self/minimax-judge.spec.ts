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
