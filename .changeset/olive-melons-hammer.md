---
'@baseplate-dev/plugin-auth': patch
---

Auth now derives its signing keys from `APP_SECRET` instead of `AUTH_SECRET` and `BETTER_AUTH_SECRET`, which are no longer read and can be dropped from your environment. Upgrading signs existing users out and invalidates outstanding one-time codes.
