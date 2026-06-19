# AIGOLF Old8 Smoke Job

AIGOLF is the first consumer project for old8.

Job script:

```text
scripts/jobs/aigolf-pc-120-smoke.sh
```

Default behavior:

- clones or updates `https://github.com/souleyez/aigolf-ops-platform.git`
- runs against `https://sd.goods-editor.com/admin/`
- keeps `PC_E2E_MUTATION=0`
- keeps `PC_E2E_AI_JUDGE=warn`
- publishes reports under `/srv/souleye-test-platform/reports/aigolf/120/<run-id>`

Expected current result:

```text
6 passed, 4 skipped
```

The skipped tests are data-changing flows and require explicit `PC_E2E_MUTATION=1`.
