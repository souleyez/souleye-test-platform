#!/usr/bin/env bash
set -euo pipefail

AIGOLF_DIR="${AIGOLF_DIR:-/opt/souleye-test-platform/projects/aigolf-ops-platform}"
AIGOLF_REPO="${AIGOLF_REPO:-git@github.com:souleyez/aigolf-ops-platform.git}"
PLATFORM_DIR="${SOULEYE_TEST_PLATFORM_DIR:-/opt/souleye-test-platform/current}"
RUN_ID="${E2E_RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"

if [ ! -d "$AIGOLF_DIR/.git" ]; then
  PARENT="$(dirname "$AIGOLF_DIR")"
  BASENAME="$(basename "$AIGOLF_DIR")"
  STAGING="$PARENT/.${BASENAME}.staging.$$"
  mkdir -p "$PARENT"
  git clone "$AIGOLF_REPO" "$STAGING"
  if [ -e "$AIGOLF_DIR" ]; then
    mv "$AIGOLF_DIR" "$PARENT/.${BASENAME}.previous.$(date +%Y%m%d%H%M%S)"
  fi
  mv "$STAGING" "$AIGOLF_DIR"
else
  git -C "$AIGOLF_DIR" fetch origin
  git -C "$AIGOLF_DIR" checkout main
  git -C "$AIGOLF_DIR" pull --ff-only origin main
fi

cd "$AIGOLF_DIR"
corepack enable
corepack prepare pnpm@11.4.0 --activate
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium

export PC_E2E_BASE_URL="${PC_E2E_BASE_URL:-https://sd.goods-editor.com/admin/}"
export PC_E2E_MUTATION="${PC_E2E_MUTATION:-0}"
export PC_E2E_AI_JUDGE="${PC_E2E_AI_JUDGE:-warn}"
export E2E_PROJECT="aigolf"
export E2E_ENV="120"
export E2E_RUN_ID="$RUN_ID"

TEST_EXIT=0
pnpm test:pc:120 || TEST_EXIT=$?

TARGET="/srv/souleye-test-platform/reports/aigolf/120/$RUN_ID"
mkdir -p "$TARGET"
if [ -d outputs/playwright-report ]; then
  cp -a outputs/playwright-report/. "$TARGET/"
fi
if [ -d outputs/playwright-artifacts ]; then
  mkdir -p "$TARGET/artifacts"
  cp -a outputs/playwright-artifacts/. "$TARGET/artifacts/"
fi
STATUS="passed"
if [ "$TEST_EXIT" -ne 0 ]; then
  STATUS="failed"
fi
printf '{"project":"aigolf","env":"120","runId":"%s","status":"%s","exitCode":%s,"createdAt":"%s"}\n' "$RUN_ID" "$STATUS" "$TEST_EXIT" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$TARGET/run.json"
if [ -f "$PLATFORM_DIR/scripts/ops/write-report-md.mjs" ]; then
  E2E_REPORT_TARGET="$TARGET" node "$PLATFORM_DIR/scripts/ops/write-report-md.mjs"
else
  echo "Markdown report writer not found: $PLATFORM_DIR/scripts/ops/write-report-md.mjs" >&2
  TEST_EXIT=1
fi
echo "$TARGET"
exit "$TEST_EXIT"
