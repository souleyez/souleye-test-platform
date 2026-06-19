# Old8 Test Platform Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy Souleye Test Platform to `8.129.12.60` ("老8服务器") as the shared E2E test runner and report archive node for AIGOLF first, then future projects.

**Architecture:** 老8服务器 hosts the reusable platform runner, browser runtime, project workspaces, scheduled jobs, and static report artifacts. Product repositories keep their own adapters and business assertions; the platform provides runner conventions, evidence capture, model-review contracts, report packaging, and report publishing. Reports must be protected because screenshots and DOM summaries can contain operational data.

**Tech Stack:** Ubuntu/Linux shell, git, Node.js 22 LTS, pnpm 11, Playwright Chromium, systemd timers, nginx static report hosting, optional model provider env file, AIGOLF as the first project job.

---

## Fixed Names And Paths

- Server alias: `老8服务器`
- Server IP: `8.129.12.60`
- SSH alias to create locally: `old8`
- Platform repo: `https://github.com/souleyez/souleye-test-platform`
- Platform server path: `/opt/souleye-test-platform/current`
- Project workspace root: `/opt/souleye-test-platform/projects`
- Report artifact root: `/srv/souleye-test-platform/reports`
- Runtime log root: `/var/log/souleye-test-platform`
- Runtime env file: `/etc/souleye-test-platform/platform.env`
- Model provider env file: `/etc/souleye-test-platform/model.env`
- nginx static root: `/var/www/souleye-test-platform`
- systemd service template: `souleye-test-platform@.service`
- systemd timer template: `souleye-test-platform@.timer`

## Deployment Model

Use old8 as a controlled test execution node, not as an app production server.

```text
GitHub repos
  -> old8 /opt/souleye-test-platform/current
  -> old8 /opt/souleye-test-platform/projects/<project>
  -> Playwright jobs
  -> outputs: traces, screenshots, videos, HTML reports, judge JSON
  -> /srv/souleye-test-platform/reports/<project>/<env>/<run-id>
  -> nginx protected static report access
```

## Security Rules

- Do not commit secrets, cookies, tokens, or `.env` files.
- Keep `E2E_AI_JUDGE=off` by default.
- Use `E2E_AI_JUDGE=warn` for rollout validation.
- Use `E2E_AI_JUDGE=fail` only after repeated stable runs.
- Keep production-data mutation disabled by default: `PC_E2E_MUTATION=0`.
- Protect report access with IP allowlist, basic auth, or private network before exposing nginx publicly.
- Sanitize model evidence before sending screenshots or DOM summaries to any remote model provider.

## Task 1: Confirm Access And Create Local SSH Alias

**Files:**
- Modify local only: `C:\Users\soulzyn\.ssh\config`
- Create local note if needed: `docs/deploy/old8-access-check.md`

**Step 1: Test direct SSH access**

Run from Windows PowerShell:

```powershell
ssh root@8.129.12.60 "hostname; whoami; uname -a; date"
```

Expected:

```text
hostname prints old8 or the current host name
whoami prints root or the configured deploy user
uname prints Linux kernel information
date prints server time
```

**Step 2: Add SSH alias**

Add to `C:\Users\soulzyn\.ssh\config`:

```sshconfig
Host old8
  HostName 8.129.12.60
  User root
  IdentityFile ~/.ssh/id_rsa
  IdentitiesOnly yes
```

If root login is disabled, replace `User root` with the actual deploy user and use `sudo` in server commands.

**Step 3: Verify alias**

```powershell
ssh old8 "echo old8-ok && hostname && whoami"
```

Expected:

```text
old8-ok
```

**Step 4: Commit nothing**

SSH config is local machine state and must not be committed.

## Task 2: Inspect Server Runtime Baseline

**Files:**
- Create: `docs/deploy/old8-runtime-baseline.md`

**Step 1: Capture OS and package manager**

```powershell
ssh old8 "cat /etc/os-release; command -v apt || command -v yum || command -v dnf; systemctl --version | head -1"
```

Expected:

```text
OS family and package manager are known
systemd is available
```

**Step 2: Check existing runtime**

```powershell
ssh old8 "node -v || true; pnpm -v || true; git --version || true; nginx -v || true"
```

Expected:

```text
Missing packages are identified before installation
```

**Step 3: Check disk and memory**

```powershell
ssh old8 "df -h / /opt /srv 2>/dev/null || df -h /; free -h"
```

Expected:

```text
At least 10 GB free disk for browser caches and reports
At least 2 GB RAM for single Chromium worker
```

**Step 4: Save baseline**

Write findings to `docs/deploy/old8-runtime-baseline.md`:

```markdown
# Old8 Runtime Baseline

- Checked at:
- OS:
- User:
- Package manager:
- Node:
- pnpm:
- Git:
- nginx:
- Disk:
- Memory:
- Notes:
```

**Step 5: Commit**

```powershell
git add docs/deploy/old8-runtime-baseline.md
git commit -m "docs: record old8 runtime baseline"
```

## Task 3: Bootstrap Server Packages

**Files:**
- Create: `scripts/deploy/old8/bootstrap-old8.sh`
- Create: `docs/deploy/old8-bootstrap.md`

**Step 1: Add bootstrap script**

Create `scripts/deploy/old8/bootstrap-old8.sh`:

```bash
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
```

**Step 2: Upload and run**

```powershell
scp scripts/deploy/old8/bootstrap-old8.sh old8:/tmp/bootstrap-old8.sh
ssh old8 "chmod +x /tmp/bootstrap-old8.sh && /tmp/bootstrap-old8.sh"
```

Expected:

```text
node -v prints v22.x
pnpm -v prints 11.4.0
directories exist
```

**Step 3: Install Playwright system dependencies**

```powershell
ssh old8 "cd /opt/souleye-test-platform/current || exit 0; true"
```

After the repo is deployed in Task 4, run:

```powershell
ssh old8 "cd /opt/souleye-test-platform/current && pnpm exec playwright install --with-deps chromium"
```

Expected:

```text
Chromium and OS dependencies installed
```

**Step 4: Commit**

```powershell
git add scripts/deploy/old8/bootstrap-old8.sh docs/deploy/old8-bootstrap.md
git commit -m "ops: add old8 bootstrap script"
```

## Task 4: Deploy Public Platform Repository

**Files:**
- Create: `scripts/deploy/old8/deploy-platform-old8.sh`
- Create: `docs/deploy/old8-platform-deploy.md`

**Step 1: Add deploy script**

Create `scripts/deploy/old8/deploy-platform-old8.sh`:

```bash
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
pnpm exec playwright install chromium
pnpm check
pnpm test
```

**Step 2: Run deploy**

```powershell
scp scripts/deploy/old8/deploy-platform-old8.sh old8:/tmp/deploy-platform-old8.sh
ssh old8 "chmod +x /tmp/deploy-platform-old8.sh && /tmp/deploy-platform-old8.sh"
```

Expected:

```text
pnpm check passes
pnpm test passes
```

**Step 3: Commit**

```powershell
git add scripts/deploy/old8/deploy-platform-old8.sh docs/deploy/old8-platform-deploy.md
git commit -m "ops: add old8 platform deploy script"
```

## Task 5: Add Report Publishing Command

**Files:**
- Create: `scripts/ops/publish-report.mjs`
- Modify: `package.json`
- Test: `tests/self/platform-smoke.spec.ts`

**Step 1: Add publish script**

Create `scripts/ops/publish-report.mjs`:

```js
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

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
writeFileSync(path.join(target, "run.json"), JSON.stringify({
  project,
  env: envName,
  runId,
  source,
  target,
  createdAt: new Date().toISOString()
}, null, 2));

console.log(target);
```

**Step 2: Add script**

Modify `package.json`:

```json
{
  "scripts": {
    "report:publish": "node scripts/ops/publish-report.mjs"
  }
}
```

**Step 3: Verify locally**

```powershell
pnpm test
$env:E2E_REPORT_ROOT="$PWD/tmp/reports"; pnpm report:publish
```

Expected:

```text
tmp/reports/platform-self/old8/<run-id>/index.html exists
```

**Step 4: Commit**

```powershell
git add package.json scripts/ops/publish-report.mjs
git commit -m "ops: add report publishing command"
```

## Task 6: Configure nginx Report Access

**Files:**
- Create: `deploy/nginx/souleye-test-platform.conf`
- Create: `docs/deploy/old8-nginx.md`

**Step 1: Add nginx config**

Create `deploy/nginx/souleye-test-platform.conf`:

```nginx
server {
  listen 8088;
  server_name _;

  root /srv/souleye-test-platform/reports;
  autoindex on;

  location / {
    try_files $uri $uri/ =404;
  }
}
```

For public exposure, add one of these before use:

```nginx
auth_basic "Souleye Test Reports";
auth_basic_user_file /etc/nginx/.souleye-test-platform.htpasswd;
```

or:

```nginx
allow <trusted-ip>;
deny all;
```

**Step 2: Install config**

```powershell
scp deploy/nginx/souleye-test-platform.conf old8:/etc/nginx/conf.d/souleye-test-platform.conf
ssh old8 "nginx -t && systemctl reload nginx"
```

Expected:

```text
nginx test is successful
```

**Step 3: Verify HTTP**

```powershell
curl.exe -I http://8.129.12.60:8088/
```

Expected:

```text
HTTP/1.1 200 OK
or HTTP/1.1 403 Forbidden if access control is enabled
```

**Step 4: Commit**

```powershell
git add deploy/nginx/souleye-test-platform.conf docs/deploy/old8-nginx.md
git commit -m "ops: add old8 report nginx config"
```

## Task 7: Add AIGOLF First Project Job

**Files:**
- Create: `examples/projects/aigolf.old8.env.example`
- Create: `scripts/jobs/aigolf-pc-120-smoke.sh`
- Create: `docs/projects/aigolf-old8.md`

**Step 1: Add env example**

Create `examples/projects/aigolf.old8.env.example`:

```bash
E2E_PROJECT=aigolf
E2E_ENV=120
E2E_AI_JUDGE=warn
PC_E2E_BASE_URL=https://sd.goods-editor.com/admin/
PC_E2E_MUTATION=0
E2E_REPORT_ROOT=/srv/souleye-test-platform/reports
```

**Step 2: Add job script**

Create `scripts/jobs/aigolf-pc-120-smoke.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

AIGOLF_DIR="${AIGOLF_DIR:-/opt/souleye-test-platform/projects/aigolf-ops-platform}"
AIGOLF_REPO="${AIGOLF_REPO:-git@github.com:souleyez/aigolf-ops-platform.git}"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"

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
```

**Step 3: Verify manually on old8**

```powershell
scp scripts/jobs/aigolf-pc-120-smoke.sh old8:/tmp/aigolf-pc-120-smoke.sh
ssh old8 "chmod +x /tmp/aigolf-pc-120-smoke.sh && /tmp/aigolf-pc-120-smoke.sh"
```

Expected:

```text
6 passed, 4 skipped
/srv/souleye-test-platform/reports/aigolf/120/<run-id> exists
```

**Step 4: Commit**

```powershell
git add examples/projects/aigolf.old8.env.example scripts/jobs/aigolf-pc-120-smoke.sh docs/projects/aigolf-old8.md
git commit -m "ops: add aigolf old8 smoke job"
```

## Task 8: Add Model Review Provider Boundary

**Files:**
- Create: `docs/model-review/provider-contract.md`
- Create: `examples/model-review/model.env.example`
- Modify: `src/core/aiJudge.ts`

**Step 1: Document provider contract**

Create `docs/model-review/provider-contract.md`:

```markdown
# Model Review Provider Contract

Default mode is local heuristic.

Remote providers must receive:
- pageName
- sanitized url
- screenshot path or image bytes
- trimmed body text
- expectation profile

Remote providers must return:

```json
{
  "pass": true,
  "score": 90,
  "reason": "Visible page content matches expected operational state.",
  "evidence": ["screenshot", "dom-summary"]
}
```

Never send:
- cookies
- authorization headers
- localStorage tokens
- full customer records
- secrets from env files
```

**Step 2: Add env example**

Create `examples/model-review/model.env.example`:

```bash
E2E_AI_JUDGE=warn
E2E_AI_PROVIDER=heuristic
# E2E_AI_PROVIDER=openai
# OPENAI_API_KEY=
# E2E_AI_MODEL=
```

**Step 3: Keep remote provider disabled**

Do not enable remote model calls in this task. Only document the boundary and keep old8 safe for first deployment.

**Step 4: Commit**

```powershell
git add docs/model-review/provider-contract.md examples/model-review/model.env.example src/core/aiJudge.ts
git commit -m "docs: define model review provider boundary"
```

## Task 9: Add systemd Service And Timer

**Files:**
- Create: `deploy/systemd/souleye-test-platform@.service`
- Create: `deploy/systemd/souleye-test-platform@.timer`
- Create: `docs/deploy/old8-systemd.md`

**Step 1: Add service template**

Create `deploy/systemd/souleye-test-platform@.service`:

```ini
[Unit]
Description=Souleye Test Platform job %i
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
EnvironmentFile=-/etc/souleye-test-platform/platform.env
EnvironmentFile=-/etc/souleye-test-platform/model.env
WorkingDirectory=/opt/souleye-test-platform/current
ExecStart=/opt/souleye-test-platform/current/scripts/jobs/%i.sh
StandardOutput=append:/var/log/souleye-test-platform/%i.log
StandardError=append:/var/log/souleye-test-platform/%i.log
```

**Step 2: Add timer template**

Create `deploy/systemd/souleye-test-platform@.timer`:

```ini
[Unit]
Description=Run Souleye Test Platform job %i

[Timer]
OnCalendar=*-*-* 07:30:00
Persistent=true
Unit=souleye-test-platform@%i.service

[Install]
WantedBy=timers.target
```

**Step 3: Install for AIGOLF**

```powershell
scp deploy/systemd/souleye-test-platform@.service old8:/etc/systemd/system/souleye-test-platform@.service
scp deploy/systemd/souleye-test-platform@.timer old8:/etc/systemd/system/souleye-test-platform@.timer
ssh old8 "systemctl daemon-reload && systemctl enable --now souleye-test-platform@aigolf-pc-120-smoke.timer"
```

**Step 4: Manual run**

```powershell
ssh old8 "systemctl start souleye-test-platform@aigolf-pc-120-smoke.service && systemctl status --no-pager souleye-test-platform@aigolf-pc-120-smoke.service"
```

Expected:

```text
service exits successfully
report folder exists under /srv/souleye-test-platform/reports/aigolf/120
```

**Step 5: Commit**

```powershell
git add deploy/systemd docs/deploy/old8-systemd.md
git commit -m "ops: add old8 systemd job templates"
```

## Task 10: Add Deployment Verification Checklist

**Files:**
- Create: `docs/deploy/old8-verification-checklist.md`

**Step 1: Add checklist**

Create `docs/deploy/old8-verification-checklist.md`:

```markdown
# Old8 Verification Checklist

## Server

- [ ] `ssh old8 "hostname; date"` works.
- [ ] `node -v` is v22.x.
- [ ] `pnpm -v` is 11.4.0.
- [ ] `nginx -t` passes.
- [ ] `/opt/souleye-test-platform/current` exists.
- [ ] `/srv/souleye-test-platform/reports` exists.

## Platform

- [ ] `cd /opt/souleye-test-platform/current && pnpm check` passes.
- [ ] `cd /opt/souleye-test-platform/current && pnpm test` passes.

## AIGOLF

- [ ] AIGOLF project workspace exists.
- [ ] `PC_E2E_MUTATION=0`.
- [ ] `PC_E2E_AI_JUDGE=warn`.
- [ ] AIGOLF 120 smoke produces `6 passed, 4 skipped`.

## Reports

- [ ] Latest report folder has `index.html`.
- [ ] Latest report folder has `run.json`.
- [ ] nginx serves or protects report directory as configured.
- [ ] Report access does not expose secrets.

## Scheduling

- [ ] `systemctl list-timers 'souleye-test-platform*'` shows AIGOLF timer.
- [ ] Manual service run succeeds.
- [ ] Logs append under `/var/log/souleye-test-platform`.
```

**Step 2: Verify checklist after deployment**

Run:

```powershell
ssh old8 "systemctl list-timers 'souleye-test-platform*' --no-pager"
ssh old8 "find /srv/souleye-test-platform/reports -maxdepth 4 -name index.html | tail -5"
curl.exe -I http://8.129.12.60:8088/
```

Expected:

```text
timer visible
report index exists
HTTP endpoint responds with expected status
```

**Step 3: Commit**

```powershell
git add docs/deploy/old8-verification-checklist.md
git commit -m "docs: add old8 verification checklist"
```

## Task 11: Push And Release The Deployment Plan

**Files:**
- All files created above.

**Step 1: Review changes**

```powershell
git status --short
git log --oneline -5
```

Expected:

```text
only old8 deployment files are changed
```

**Step 2: Run local validation**

```powershell
pnpm check
pnpm test
```

Expected:

```text
all platform self-tests pass
```

**Step 3: Push**

```powershell
git push
```

Expected:

```text
main pushed to https://github.com/souleyez/souleye-test-platform
```

## Rollback Plan

If deployment breaks old8:

```powershell
ssh old8 "systemctl disable --now souleye-test-platform@aigolf-pc-120-smoke.timer || true"
ssh old8 "systemctl stop souleye-test-platform@aigolf-pc-120-smoke.service || true"
ssh old8 "rm -f /etc/nginx/conf.d/souleye-test-platform.conf && nginx -t && systemctl reload nginx"
```

Do not delete report artifacts by default. Move or archive them only after confirming they are no longer needed.

## Done Criteria

- `old8` SSH alias works for `8.129.12.60`.
- Public platform repo is deployed to `/opt/souleye-test-platform/current`.
- `pnpm check` and `pnpm test` pass on old8.
- AIGOLF 120 smoke runs from old8 with `PC_E2E_MUTATION=0`.
- Latest AIGOLF report is stored under `/srv/souleye-test-platform/reports/aigolf/120/<run-id>`.
- Report access through nginx is either protected or intentionally internal-only.
- systemd timer is installed but can be disabled quickly.
- Model review remains `warn` or `off`; no remote provider is enabled without a data-safety review.
