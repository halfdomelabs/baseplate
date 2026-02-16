---
'@baseplate-dev/plugin-auth': patch
---

Move auth-verification service to accounts level and add cleanup queue

- Moved `auth-verification.service.ts` from `accounts/password/services/` to `accounts/services/` since it implements a generic split-token pattern that can be reused across different authentication types
- Transferred template ownership from `auth-email-password` generator to `auth-module` generator for better architectural alignment
- Added `cleanup-auth-verification.queue.ts` that runs hourly (at minute 15) to automatically delete expired auth verification tokens
- Added `@baseplate-dev/plugin-queue` as a dependency for queue integration
