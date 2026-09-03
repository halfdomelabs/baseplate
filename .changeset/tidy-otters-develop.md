---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-observability': patch
---

Editing a component, hook, or service in a generated web app now updates the page in place instead of rebuilding the router and remounting the whole app, so your route, scroll position, and open subscriptions survive a save. Sentry is now initialised from `main.tsx` via `initSentry(router)` rather than importing the router itself.
