---
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/fastify-generators': patch
---

Fix login and change-password failing with an internal server error instead of an invalid credentials message when the account has no stored password, which affected logging in with an unrecognized email address and changing the password on accounts linked only to a social provider
