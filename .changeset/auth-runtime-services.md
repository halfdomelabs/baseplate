---
'@baseplate-dev/plugin-auth': patch
---

Generated auth backends (local-auth, Better Auth, and the placeholder auth fallback) now construct their user-session service once as part of the shared app runtime and expose it via `runtime.services.userSession`, instead of each module exporting its own module-level singleton. Better Auth's server instance is built the same way via `runtime.services.betterAuth`, and local-auth's email-verification/password-reset queue jobs are dispatched through the runtime's queue service rather than a directly-imported queue.
