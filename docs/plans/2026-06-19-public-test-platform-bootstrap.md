# Public Test Platform Bootstrap Plan

**Goal:** Create an independent public repository that can become the reusable E2E test platform for multiple projects.

**Architecture:** Keep the platform as a shared Playwright, evidence, reporting, and model-review framework. Product repositories own their own login, data setup, business flows, and project-specific assertions through adapters and expectation profiles. AI quality review is exposed as a provider-neutral interface with `off`, `warn`, and `fail` modes; `warn` is the default rollout mode until false positives are understood.

**Initial Scope:**

- Local workspace: `C:\Users\soulzyn\Desktop\codex\souleye-test-platform`
- GitHub repository: `souleyez/souleye-test-platform`
- Shared helpers: white-screen checks, evidence capture, AI judge contract, local heuristic judge.
- Self-test: a minimal Playwright page inspection test that does not depend on a production service.
- First project adapter example: AIGOLF operations page.

## Target Platform Architecture

### Platform core

The public platform owns reusable mechanics:

- Playwright baseline configuration.
- Browser artifact conventions: screenshot, video, trace, HTML report, JSON judge output.
- White-screen checks and generic runtime-error checks.
- Console and network failure collection.
- Evidence capture and sanitization.
- AI judge contract and local heuristic fallback.
- Report summary generation.

### Project adapter

Each product repository owns project-specific behavior:

- Base URLs and environment names.
- Login and session setup.
- Menu/page inventory.
- Seed data and cleanup.
- Product flows and deterministic assertions.
- Page expectation profiles for model review.

A project should pass an adapter/profile into the platform rather than adding product logic to this repository.

### Model review flow

```text
Playwright page
  -> deterministic assertions
  -> screenshot + DOM summary + console/network evidence
  -> sanitizer/redactor
  -> model judge provider
  -> { pass, score, reason, evidence }
  -> report attachment
```

Deterministic Playwright assertions remain the first release gate. Model review starts in `warn` mode and writes evidence into the report. `fail` mode is only acceptable for checks that have proven stable across repeated local and production smoke runs.

### Provider strategy

The platform should not bind itself to one model provider. The first provider contract is:

```ts
type AiJudgeProvider = (input: {
  pageName: string;
  evidence: PageEvidence;
  expectationProfile?: PageExpectationProfile;
}) => Promise<AiJudgeResult>;
```

Every provider must return:

```json
{
  "pass": false,
  "score": 42,
  "reason": "Page body is rendered but the expected operational content is missing.",
  "evidence": ["screenshot path", "url", "missing expected content"]
}
```

The first implementation can remain local heuristic-only so projects can adopt the platform without credentials. A real model provider should be added behind the same contract.

### Safety rules

- Default `E2E_AI_JUDGE` mode is `off`.
- Recommended rollout mode is `warn`.
- Never upload secrets, tokens, cookies, authorization headers, or unredacted customer records to a remote model provider.
- Keep screenshot and DOM text trimming configurable per project.
- Store judge output as evidence, not as a replacement for deterministic assertions.

## Platform Roadmap

### Phase 1: Bootstrap repository

- Keep current source layout:

```text
src/core/
tests/self/
examples/
docs/plans/
```

- Keep the self-test independent of any production service.
- Verify:

```powershell
pnpm check
pnpm test
```

### Phase 2: AIGOLF as first consumer

- Build AIGOLF PC admin P0 tests in `aigolf-ops-platform`.
- Keep AIGOLF login, menus, caddie/player/departure/event flows in that repository.
- Use local copies or shims first if the public package API is still changing.
- After one successful local run and one successful 120 smoke run, extract only generic helpers into this repository.

### Phase 3: Package and import boundary

- Decide whether the platform is consumed as an npm package, GitHub dependency, or workspace package.
- Export only stable public APIs from `src/index.ts`.
- Keep project adapters outside the package unless they are examples.
- Add a changelog before the second project consumes the package.

### Phase 4: Real model provider

- Add a provider adapter behind `AiJudgeProvider`.
- Add evidence redaction before model upload.
- Add prompt templates that are generic, with project-specific expectations passed as data.
- Keep model failures non-blocking in `warn` mode.

### Phase 5: Report publishing

- Add one command that collects HTML report, traces, screenshots, videos, and judge JSON.
- Generate a compact release summary for humans.
- Optionally upload reports to a static artifact host or CI artifact store.

### Phase 6: Multi-project platform

- Add a second real project before broadening the API.
- Promote only repeated patterns into the core.
- Keep business assertions in project repositories.
- Add documentation for onboarding a new project in less than one hour.

## Follow-up Tasks

1. Prove AIGOLF PC admin P0 tests locally with duplicated helpers.
2. Move only reusable helpers into this platform after one successful AIGOLF run.
3. Add a real LLM provider adapter after the JSON report shape is stable.
4. Add report publishing only after local artifact layout is stable.
5. Add a project adapter template after the second project confirms the same adapter shape.
