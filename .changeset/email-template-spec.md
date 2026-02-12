---
'@baseplate-dev/plugin-email': patch
'@baseplate-dev/plugin-auth': patch
---

Add emailTemplateSpec for cross-plugin email template registration

Introduces `emailTemplateSpec` in plugin-email, allowing other plugins to register email template generators with the transactional library compilation process. The auth plugin now uses this spec to register password-reset, password-changed, and account-verification email templates as proper generators instead of using snapshots. Also exports `emailTemplatesProvider` and adds component project exports to enable cross-generator template imports.
