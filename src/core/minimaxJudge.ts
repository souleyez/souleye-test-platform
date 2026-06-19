import type { AiJudgeProvider, AiJudgeResult, PageEvidence, PageExpectationProfile } from "./types";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export function minimaxJudge(expectationProfile: PageExpectationProfile = {}, env = process.env): AiJudgeProvider {
  return async ({ pageName, evidence }) => {
    const apiKey = env.MINIMAX_API_KEY;
    if (!apiKey) throw new Error("MINIMAX_API_KEY is not configured");

    const baseUrl = stripTrailingSlash(env.MINIMAX_BASE_URL || "https://api.minimax.io/v1");
    const model = env.MINIMAX_MODEL || env.E2E_AI_MODEL || "MiniMax-M3";
    const timeoutMs = Number(env.E2E_AI_TIMEOUT_MS || 30000);

    const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a strict E2E web QA reviewer. Return only compact JSON with pass, score, reason, and evidence. Do not include markdown."
          },
          {
            role: "user",
            content: buildPrompt(pageName, evidence, expectationProfile, env)
          }
        ],
        temperature: 0.2,
        max_completion_tokens: 500,
        thinking: { type: "disabled" }
      })
    }, timeoutMs);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`MiniMax judge failed: HTTP ${response.status} ${body.slice(0, 200)}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("MiniMax judge returned empty content");

    return normalizeJudgeResult(parseJsonObject(stripThinkBlocks(content)));
  };
}

function buildPrompt(pageName: string, evidence: PageEvidence, profile: PageExpectationProfile, env: NodeJS.ProcessEnv) {
  const maxBodyChars = Number(env.E2E_AI_MAX_BODY_CHARS || 2500);
  const expectedContent = (profile.expectedContent ?? []).map((item) => String(item));

  return JSON.stringify({
    task: "Review whether this admin page looks complete enough for a smoke test.",
    pageName,
    url: sanitizeUrl(evidence.url),
    title: evidence.title,
    bodyText: evidence.bodyText.slice(0, maxBodyChars),
    expectationProfile: {
      expectedContent,
      minBodyTextLength: profile.minBodyTextLength ?? 80
    },
    outputSchema: {
      pass: "boolean",
      score: "number 0-100",
      reason: "short Chinese explanation",
      evidence: "array of short strings"
    }
  });
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function sanitizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return value.split("?")[0] ?? value;
  }
}

function stripThinkBlocks(value: string) {
  return value.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

function parseJsonObject(value: string) {
  const direct = tryParseJson(value);
  if (direct) return direct;

  const match = value.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("MiniMax judge did not return JSON");
  const parsed = tryParseJson(match[0]);
  if (!parsed) throw new Error("MiniMax judge JSON is invalid");
  return parsed;
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function normalizeJudgeResult(value: unknown): AiJudgeResult {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    pass: record.pass === true,
    score: clampScore(record.score),
    reason: typeof record.reason === "string" && record.reason.trim() ? record.reason.slice(0, 500) : "MiniMax judge returned no reason.",
    evidence: Array.isArray(record.evidence)
      ? record.evidence.map((item) => String(item).slice(0, 300)).slice(0, 8)
      : []
  };
}

function clampScore(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, number));
}
