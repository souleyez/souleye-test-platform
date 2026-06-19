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
