#!/usr/bin/env bash
set -euo pipefail

if command -v apt-get >/dev/null 2>&1; then
  apt-get update
  apt-get install -y ca-certificates curl git nginx unzip jq
else
  echo "Unsupported package manager. Install git, curl, nginx, unzip, jq manually." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q '^v22\.'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

corepack enable
corepack prepare pnpm@11.4.0 --activate

mkdir -p /opt/souleye-test-platform/current
mkdir -p /opt/souleye-test-platform/projects
mkdir -p /srv/souleye-test-platform/reports
mkdir -p /var/log/souleye-test-platform
mkdir -p /etc/souleye-test-platform
mkdir -p /var/www/souleye-test-platform

echo "old8 bootstrap complete"
