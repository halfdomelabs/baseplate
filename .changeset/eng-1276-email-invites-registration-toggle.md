---
'@baseplate-dev/plugin-auth': patch
---

Local auth now supports inviting a user by email to set up their account via a "Send Invite" admin action, and each web app can independently disable self-service registration; once every web app on a backend disables it, the registration mutation itself is removed from the API.
