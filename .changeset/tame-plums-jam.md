---
'@baseplate-dev/plugin-auth': patch
---

Fixed the initial user seed script occasionally failing because no name was supplied. The seed script now sets the initial user's name from a new `INITIAL_USER_NAME` seed environment variable, defaulting to "Admin" if not set.
