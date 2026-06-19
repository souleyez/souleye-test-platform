# Old8 Platform Deploy

Use `scripts/deploy/old8/deploy-platform-old8.sh` to clone or update the public platform on old8.

On first deploy, the script clones into a staging directory and moves it into `current` only after clone succeeds. This avoids leaving `/opt/souleye-test-platform/current` empty after a network interruption.

```powershell
scp scripts/deploy/old8/deploy-platform-old8.sh old8:/tmp/deploy-platform-old8.sh
ssh old8 "chmod +x /tmp/deploy-platform-old8.sh && /tmp/deploy-platform-old8.sh"
```

The script deploys `https://github.com/souleyez/souleye-test-platform.git` to:

```text
/opt/souleye-test-platform/current
```

It then runs:

```text
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium
pnpm check
pnpm test
```
