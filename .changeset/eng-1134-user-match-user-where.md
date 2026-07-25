---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-server': patch
---

Added `r.userMatch` and `r.userWhere` role-builder verbs alongside `r.match`/`r.where`, for role predicates keyed on the authenticated user's id. Their callback only runs for an authenticated principal (receiving the session with `userId` guaranteed non-null), so the generated policy no longer needs a per-role `ctx.auth.userId != null ? {...} : false` guard — an anonymous caller is denied automatically before the callback runs.
