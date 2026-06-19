import type { AiJudgeMode } from "./types";

export function getBaseUrl(defaultUrl = "http://localhost:5173", env = process.env) {
  return env.PC_E2E_BASE_URL || env.E2E_BASE_URL || defaultUrl;
}

export function getAiJudgeMode(env = process.env): AiJudgeMode {
  const mode = env.PC_E2E_AI_JUDGE || env.E2E_AI_JUDGE;
  return mode === "warn" || mode === "fail" ? mode : "off";
}

