# Old8 Access Check

- Server alias: `old8` / `老8服务器`
- Server IP: `8.129.12.60`
- SSH port check: reachable on port `22`
- Local SSH config: alias created in `C:\Users\soulzyn\.ssh\config`
- Host key: added to local `known_hosts`
- Current blocker: SSH authentication fails for tested users.

Observed failure:

```text
root@8.129.12.60: Permission denied (publickey,password).
```

Tested users:

- `root`
- `ubuntu`
- `admin`
- `soulz`
- `ecs-user`

Next required external action:

- Add the local public key to the correct server user's `authorized_keys`, or provide the correct user/private key/password for old8.
