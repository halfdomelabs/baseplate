---
'@baseplate-dev/plugin-queue': patch
'@baseplate-dev/plugin-notifications': patch
---

Queue definitions can now declare an `onFinalAttemptFailure` hook beside their retry config, which runs when a handler throws on the last attempt and lets the job complete instead of failing; jobs also expose `maxAttempts` alongside `attemptNumber`.
