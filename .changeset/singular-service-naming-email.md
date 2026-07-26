---
'@baseplate-dev/plugin-email': patch
---

Renamed generated `emails.service.ts`/`emails.types.ts` to `email.service.ts`/`email.types.ts`, `postmark.service.ts` to `postmark.adapter.ts`, `resend.service.ts` to `resend.adapter.ts`, and `stub.service.ts` to `stub.adapter.ts` for consistency with the codebase's singular service-naming convention. The `services.emails` app-runtime key is now `services.email` to match.
