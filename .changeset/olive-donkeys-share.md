---
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-email': patch
'@baseplate-dev/ui-components': patch
'@baseplate-dev/react-generators': patch
---

Local auth can now offer passwordless sign-in with a single-use code emailed to the user, enabled with the new "Email Sign-in Codes" setting. This adds an `attempts` column to the auth verification model, so existing local auth projects will need a database migration on their next sync.
