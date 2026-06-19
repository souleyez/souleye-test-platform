# Model Review Provider Contract

Default mode is local heuristic. Remote model providers are optional and must stay disabled until data handling is reviewed.

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
