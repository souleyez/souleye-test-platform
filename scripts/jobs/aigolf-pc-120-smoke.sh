#!/usr/bin/env bash
set -euo pipefail

AIGOLF_DIR="${AIGOLF_DIR:-/opt/souleye-test-platform/projects/aigolf-ops-platform}"
AIGOLF_REPO="${AIGOLF_REPO:-https://github.com/souleyez/aigolf-ops-platform.git}"
RUN_ID="${E2E_RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"

if [ ! -d "$AIGOLF_DIR/.git" ]; then
  rm -rf "$AIGOLF_DIR"
  git clone "$AIGOLF_REPO" "$AIGOLF_DIR"
else
  git -C "$AIGOLF_DIR" fetch origin
  git -C "$AIGOLF_DIR" checkout main
  git -C "$AIGOLF_DIR" pull --ff-only origin main
fi

cd "$AIGOLF_DIR"
corepack enable
corepack prepare pnpm@11.4.0 --activate
pnpm install --frozen-lockfile
pnpm exec playwright install chromium

export PC_E2E_BASE_URL="${PC_E2E_BASE_URL:-https://sd.goods-editor.com/admin/}"
export PC_E2E_MUTATION="${PC_E2E_MUTATION:-0}"
export PC_E2E_AI_JUDGE="${PC_E2E_AI_JUDGE:-warn}"
export E2E_PROJECT="aigolf"
export E2E_ENV="120"
export E2E_RUN_ID="$RUN_ID"

pnpm test:pc:120

TARGET="/srv/souleye-test-platform/reports/aigolf/120/$RUN_ID"
mkdir -p "$TARGET"
cp -a outputs/playwright-report/. "$TARGET/"
printf '{"project":"aigolf","env":"120","runId":"%s","createdAt":"%s"}\n' "$RUN_ID" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$TARGET/run.json"
echo "$TARGET"
