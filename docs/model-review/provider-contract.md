# Model Review Provider Contract

Default mode is local heuristic. Remote model providers are optional and should start in `warn` mode until false positives and data handling are understood.

Remote providers may receive:

- `pageName`
- sanitized URL
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

The platform API keeps the provider boundary generic through `AiJudgeProvider`. Project-specific rules should be passed as data through an expectation profile, not hard-coded into the shared provider.

## MiniMax

MiniMax is supported through its OpenAI-compatible Chat Completions API.

```bash
E2E_AI_JUDGE=warn
E2E_AI_PROVIDER=minimax
MINIMAX_API_KEY=...
MINIMAX_BASE_URL=https://api.minimax.io/v1
MINIMAX_MODEL=MiniMax-M3
```

Use `https://api.minimax.io/v1` for the international endpoint, or `https://api.minimaxi.com/v1` for the China endpoint.

The first implementation sends a sanitized URL, title, trimmed body text, and expectation profile. It does not send cookies, authorization headers, localStorage, or screenshot bytes by default.

Enable visual review explicitly:

```bash
E2E_AI_VISION=1
E2E_AI_MAX_IMAGE_BYTES=8000000
```

When enabled, the provider sends the Playwright screenshot as a base64 `image_url` together with the text prompt. This allows the model to inspect blank screens, broken layouts, overlapping text, modal overlays, and whether the screenshot visually matches the expected page.

MiniMax's documented example uses a publicly reachable image URL. On old8, configure:

```bash
E2E_AI_IMAGE_PUBLIC_ROOT=/srv/souleye-test-platform/vision-inputs
E2E_AI_IMAGE_BASE_URL=http://8.129.12.60/test-vision-inputs
```

With those variables set, screenshots are copied to the public root and the model receives a URL instead of inline base64. Directory listing is disabled in nginx; the URL is still bearer-style access to the screenshot, so keep it limited to smoke-test evidence and rotate/clean old files as needed.
