# Public Test Platform Bootstrap Plan

**Goal:** Create an independent public repository that can become the reusable E2E test platform for multiple projects.

**Architecture:** Keep the platform as a shared Playwright and evidence framework. Product repositories own their own login, data setup, business flows, and project-specific assertions. AI quality review is exposed as a provider-neutral interface and starts in warning mode.

**Initial Scope:**

- Local workspace: `C:\Users\soulzyn\Desktop\codex\souleye-test-platform`
- GitHub repository: `souleyez/souleye-test-platform`
- Shared helpers: white-screen checks, evidence capture, AI judge contract, local heuristic judge.
- Self-test: a minimal Playwright page inspection test that does not depend on a production service.
- First project adapter example: AIGOLF operations page.

**Follow-up Tasks:**

1. Prove AIGOLF PC admin P0 tests locally with duplicated helpers.
2. Move only reusable helpers into this platform after one successful AIGOLF run.
3. Add a real LLM provider adapter after the JSON report shape is stable.
4. Add report publishing only after local artifact layout is stable.

