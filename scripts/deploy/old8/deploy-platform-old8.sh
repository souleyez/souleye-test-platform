#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/souleyez/souleye-test-platform.git}"
TARGET="${TARGET:-/opt/souleye-test-platform/current}"

if [ ! -d "$TARGET/.git" ]; then
  PARENT="$(dirname "$TARGET")"
  BASENAME="$(basename "$TARGET")"
  STAGING="$PARENT/.${BASENAME}.staging.$$"
  mkdir -p "$PARENT"
  git clone "$REPO_URL" "$STAGING"
  if [ -e "$TARGET" ]; then
    mv "$TARGET" "$PARENT/.${BASENAME}.previous.$(date +%Y%m%d%H%M%S)"
  fi
  mv "$STAGING" "$TARGET"
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
pnpm exec playwright install --with-deps chromium
pnpm check
pnpm test

echo "old8 platform deploy complete"
