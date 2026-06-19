# Old8 nginx Report Access

Install the nginx config after old8 report publishing is working.

```powershell
scp deploy/nginx/souleye-test-platform.conf old8:/etc/nginx/conf.d/souleye-test-platform.conf
ssh old8 "nginx -t && systemctl reload nginx"
```

Report URLs:

```text
http://127.0.0.1:8088/
http://8.129.12.60/test-reports/
```

The public old8 path uses HTTP Basic Auth through:

```text
/etc/nginx/.souleye-test-platform.htpasswd
```

Reports may contain screenshots and DOM summaries from operational systems.
