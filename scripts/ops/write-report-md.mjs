import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export function writeMarkdownReport(options = {}) {
  const target = resolveTarget(options);
  if (!existsSync(target)) {
    throw new Error(`Report target not found: ${target}`);
  }

  const metadata = options.metadata || readJson(path.join(target, "run.json")) || defaultMetadata(target);
  const judgeFiles = walkFiles(target).filter((file) => file.includes(`${path.sep}ai-judge${path.sep}`) && file.endsWith(".json"));
  const judges = judgeFiles.map((file) => readJudge(target, file)).filter(Boolean);
  const markdown = buildMarkdown(target, metadata, judges);
  const outputPath = path.join(target, "report.md");
  writeFileSync(outputPath, markdown, "utf8");
  return outputPath;
}

function resolveTarget(options) {
  if (options.target) return path.resolve(options.target);
  if (process.env.E2E_REPORT_TARGET) return path.resolve(process.env.E2E_REPORT_TARGET);

  const project = process.env.E2E_PROJECT || "platform-self";
  const envName = process.env.E2E_ENV || "old8";
  const runId = process.env.E2E_RUN_ID || new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const reportRoot = process.env.E2E_REPORT_ROOT || "/srv/souleye-test-platform/reports";
  return path.join(reportRoot, project, envName, runId);
}

function defaultMetadata(target) {
  return {
    project: process.env.E2E_PROJECT || "platform-self",
    env: process.env.E2E_ENV || "old8",
    runId: process.env.E2E_RUN_ID || path.basename(target),
    status: process.env.E2E_STATUS || "unknown",
    exitCode: process.env.E2E_EXIT_CODE,
    createdAt: new Date().toISOString()
  };
}

function buildMarkdown(target, metadata, judges) {
  const lines = [
    "# E2E Test Report",
    "",
    `- Project: ${value(metadata.project)}`,
    `- Environment: ${value(metadata.env ?? metadata.envName)}`,
    `- Run ID: ${value(metadata.runId)}`,
    `- Status: ${formatStatus(metadata.status)}`,
    `- Exit code: ${value(metadata.exitCode)}`,
    `- Created at: ${value(metadata.createdAt)}`,
    "",
    "## Links",
    "",
    linkLine("Playwright HTML report", target, path.join(target, "index.html")),
    linkLine("Run metadata", target, path.join(target, "run.json")),
    "",
    "## AI Review",
    ""
  ];

  if (judges.length === 0) {
    lines.push("- No AI judge JSON files were found.", "");
  } else {
    for (const judge of judges) {
      lines.push(`### ${judge.title}`, "");
      lines.push(`- Result: ${judge.pass ? "pass" : "fail"}`);
      lines.push(`- Score: ${value(judge.score)}`);
      lines.push(`- Reason: ${value(judge.reason)}`);
      if (judge.screenshots.length > 0) {
        for (const screenshot of judge.screenshots) {
          lines.push(linkLine("Screenshot", target, screenshot));
        }
      }
      if (judge.evidence.length > 0) {
        lines.push("- Evidence:");
        for (const item of judge.evidence.slice(0, 10)) {
          lines.push(`  - ${singleLine(item)}`);
        }
      }
      lines.push("");
    }
  }

  lines.push("## Artifacts", "");
  const artifactHints = [
    path.join(target, "artifacts"),
    path.join(target, "trace.zip")
  ];
  for (const artifact of artifactHints) {
    if (existsSync(artifact)) lines.push(linkLine(path.basename(artifact), target, artifact));
  }
  lines.push("");

  return `${lines.filter((line) => line !== undefined).join("\n").trim()}\n`;
}

function readJudge(target, file) {
  const data = readJson(file);
  if (!data) return undefined;

  const dir = path.dirname(file);
  const screenshots = readdirSync(dir)
    .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
    .map((name) => path.join(dir, name));
  const title = screenshots[0] ? titleFromFile(screenshots[0]) : titleFromFile(file);

  return {
    title,
    pass: data.pass === true,
    score: data.score,
    reason: data.reason,
    evidence: Array.isArray(data.evidence) ? data.evidence.map(String) : [],
    screenshots: screenshots.map((screenshot) => path.resolve(target, screenshot))
  };
}

function walkFiles(root) {
  const results = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !existsSync(current)) continue;
    const stat = statSync(current);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(current)) {
        stack.push(path.join(current, entry));
      }
    } else if (stat.isFile()) {
      results.push(current);
    }
  }
  return results;
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

function linkLine(label, target, file) {
  if (!existsSync(file)) return undefined;
  return `- ${label}: [${path.basename(file)}](${relativeLink(target, file)})`;
}

function relativeLink(target, file) {
  return path.relative(target, file).split(path.sep).map(encodeURIComponent).join("/");
}

function titleFromFile(file) {
  const basename = path.basename(file, path.extname(file));
  return basename.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatus(status) {
  if (!status) return "unknown";
  return String(status);
}

function value(input) {
  if (input === undefined || input === null || input === "") return "unknown";
  return singleLine(input);
}

function singleLine(input) {
  return String(input).replace(/\s+/g, " ").trim();
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const outputPath = writeMarkdownReport();
  mkdirSync(path.dirname(outputPath), { recursive: true });
  console.log(outputPath);
}
