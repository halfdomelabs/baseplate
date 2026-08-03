---
'@baseplate-dev/plugin-notifications': patch
---

Notifications can now take a stable `key`, so repeat activity on the same thing collapses into one row that updates in place and returns to the top of the feed, and `retract` withdraws it when the underlying event is undone. `notifyMany` takes an `idempotencyKey` so a replayed fan-out no longer notifies the audience twice, and `notify` returns a null `requestId` when a keyed call finds nothing changed.
