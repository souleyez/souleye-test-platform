#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/souleyez/souleye-test-platform.git}"
TARGET="${TARGET:-/opt/souleye-test-platform/current}"

if [ ! -d "$TARGET/.git" ]; then
  rm -rf "$TARGET"
  git clone "$REPO_URL" "$TARGET"
else
  git -C "$TARGET" fetch origin
  git -C "$TARGET" checkout main
  git -C "$TARGET" pull --ff-only origin main
fi

cd "$TARGET"
corepack enable
corepack prepare pnpm@11.4.0 --activate
pnpm install --frozen-lockfile
find scripts -name '*.sh' -type f -exec chmod +x {} +
pnpm exec playwright install chromium
pnpm check
pnpm test

echo "old8 platform deploy complete"
