# Old8 Bootstrap

Use `scripts/deploy/old8/bootstrap-old8.sh` after SSH login is available.

```powershell
scp scripts/deploy/old8/bootstrap-old8.sh old8:/tmp/bootstrap-old8.sh
ssh old8 "chmod +x /tmp/bootstrap-old8.sh && /tmp/bootstrap-old8.sh"
```

Expected result:

- Node.js `v22.x`
- pnpm `11.4.0`
- git, nginx, unzip, jq installed
- runtime directories created under `/opt`, `/srv`, `/var/log`, and `/etc`

Do not run this script until SSH authentication is confirmed.
