---
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-email': patch
'@baseplate-dev/ui-components': patch
'@baseplate-dev/react-generators': patch
---

Local auth can now offer passwordless sign-in with a single-use code emailed to the user, enabled with the new "Email Sign-in Codes" setting. Existing local auth projects pick up a schema change and will need a database migration on their next sync.
