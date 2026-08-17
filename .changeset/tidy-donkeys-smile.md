---
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/react-generators': patch
---

Signing in, signing out, and session changes from another tab no longer unmount the app, so the previous screen no longer flashes before the new one and page state survives the transition.
