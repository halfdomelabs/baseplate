---
"@baseplate-dev/plugin-notifications": patch
---

Any notification type deriving a group key can now withdraw a fact from every recipient at once via `retractAll`, and a batched type's `resolveParams` runs again per outbound send so email can phrase a delta ("3 new likes") while the feed keeps showing current state — `resolveParams` takes a second argument carrying that delivery window, and a new index on the notification delivery table (via a migration) supports it.
