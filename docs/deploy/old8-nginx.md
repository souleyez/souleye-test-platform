# Old8 nginx Report Access

Install the nginx config after old8 report publishing is working.

```powershell
scp deploy/nginx/souleye-test-platform.conf old8:/etc/nginx/conf.d/souleye-test-platform.conf
ssh old8 "nginx -t && systemctl reload nginx"
```

Default report URL:

```text
http://8.129.12.60:8088/
```

The default config is intentionally simple and should be protected before broad exposure:

- IP allowlist, or
- basic auth, or
- private network only.

Reports may contain screenshots and DOM summaries from operational systems.
