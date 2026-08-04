---
"@baseplate-dev/plugin-notifications": patch
---

Rendered notification content is now a required `title` plus an optional `body`, segments are `{ kind, text }` with `emphasis` replacing the `bold` flag, and the stored fallback collapses into a single nullable `frozenContent` column holding plain strings. Notifications no longer have an actor: whoever triggered one travels in `params`, and `render` receives those params directly instead of an event wrapper.
