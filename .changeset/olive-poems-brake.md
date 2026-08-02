---
'@baseplate-dev/plugin-auth': patch
---

Successful logins no longer count against the per-IP login rate limit, so users behind a shared IP are no longer locked out by ordinary repeated logins.
