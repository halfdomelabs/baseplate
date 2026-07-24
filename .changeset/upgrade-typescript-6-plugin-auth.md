---
'@baseplate-dev/plugin-auth': patch
---

Update the Better Auth session service's `getSessionInfoFromRequest` to accept the optional `reply` parameter declared by `UserSessionService`, removing the need for a type assertion at the call site that TypeScript 6 flagged as unnecessary.
