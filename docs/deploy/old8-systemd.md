# Old8 systemd Jobs

Install templates:

```powershell
scp deploy/systemd/souleye-test-platform@.service old8:/etc/systemd/system/souleye-test-platform@.service
scp deploy/systemd/souleye-test-platform@.timer old8:/etc/systemd/system/souleye-test-platform@.timer
ssh old8 "systemctl daemon-reload"
```

Enable AIGOLF daily smoke:

```powershell
ssh old8 "systemctl enable --now souleye-test-platform@aigolf-pc-120-smoke.timer"
```

Manual run:

```powershell
ssh old8 "systemctl start souleye-test-platform@aigolf-pc-120-smoke.service"
ssh old8 "systemctl status --no-pager souleye-test-platform@aigolf-pc-120-smoke.service"
```

Logs:

```text
/var/log/souleye-test-platform/aigolf-pc-120-smoke.log
```
