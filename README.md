# Souleye Test Platform

Public E2E test platform seed for reusable browser-based release checks.

This repository is intended to host shared testing infrastructure that can be reused by multiple projects. Project-specific business flows should stay in each product repository and call into this platform through adapters.

## What Belongs Here

- Playwright baseline configuration.
- Shared white-screen and runtime-error checks.
- Screenshot, video, trace, and HTML report conventions.
- Markdown report generation through `report.md`.
- Provider-neutral AI quality judge interface.
- Local heuristic judge for zero-credential smoke runs.
- Examples showing how a product project can plug in its own login, menus, seed data, and business assertions.

## What Does Not Belong Here

- Product secrets or production credentials.
- Project-specific test data that mutates real customer records.
- Business-only rules such as AIGOLF caddie phone requirements.
- Hard-coded deployment targets that only make sense for one project.

## Commands

```powershell
pnpm install
pnpm check
pnpm test
pnpm report:md
pnpm test:e2e:report
```

Optional AI judge modes:

```powershell
$env:PC_E2E_AI_JUDGE="off"; pnpm test
$env:PC_E2E_AI_JUDGE="warn"; pnpm test
$env:PC_E2E_AI_JUDGE="fail"; pnpm test
```

Default mode is `off`. Use `warn` first when onboarding a project. Use `fail` only after false positives are understood.

## Repository Shape

```text
src/core/                 shared platform helpers
tests/self/               platform self-checks
examples/                 project adapter examples
docs/plans/               implementation and rollout plans
outputs/                  generated test reports, ignored by git
```

## First Consumer

AIGOLF can be the first project to consume this platform. Its product-specific E2E tests should remain in `aigolf-ops-platform`, while shared helpers graduate into this repository only after they are proven reusable.
