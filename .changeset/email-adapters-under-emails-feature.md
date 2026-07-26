---
'@baseplate-dev/plugin-email': patch
---

The Postmark, Resend, and stub email adapters now register their generated code under the email feature instead of the app root, so their service files land inside the emails module (e.g. `modules/emails/services/postmark.service.ts`) consistently. This aligns the generated path with the module the code belongs to and keeps template extraction stable across repeated runs.
