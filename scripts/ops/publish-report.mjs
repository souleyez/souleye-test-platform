import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { writeMarkdownReport } from "./write-report-md.mjs";

const project = process.env.E2E_PROJECT || "platform-self";
const envName = process.env.E2E_ENV || "old8";
const runId = process.env.E2E_RUN_ID || new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const reportRoot = process.env.E2E_REPORT_ROOT || "/srv/souleye-test-platform/reports";
const source = process.env.E2E_REPORT_SOURCE || "outputs/playwright-report";
const target = path.join(reportRoot, project, envName, runId);

if (!existsSync(source)) {
  throw new Error(`Report source not found: ${source}`);
}

mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
const metadata = {
  project,
  env: envName,
  runId,
  status: process.env.E2E_STATUS || "unknown",
  exitCode: process.env.E2E_EXIT_CODE ?? null,
  source,
  target,
  createdAt: new Date().toISOString()
};
writeFileSync(path.join(target, "run.json"), JSON.stringify(metadata, null, 2));
writeMarkdownReport({ target, metadata });

console.log(target);
