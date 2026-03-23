---
'@baseplate-dev/plugin-auth': patch
---

Add authorization rules to the User model's email field in both Better Auth and Placeholder Auth plugins, restricting email visibility to admins and the user themselves (via a new "self" instance role)
