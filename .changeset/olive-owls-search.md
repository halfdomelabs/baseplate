---
'@baseplate-dev/plugin-auth': patch
---

Password reset and email verification links now point back to the app the request came from, so a reset started on the admin console emails an admin console link instead of always linking to the project's default web app; a request from an unrecognised origin still falls back to that default. Invite links are unchanged.
