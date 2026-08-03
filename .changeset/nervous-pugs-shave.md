---
'@baseplate-dev/plugin-notifications': patch
---

Notification types now require a `category` and render a single event by default, opting into batched rendering explicitly via `aggregate` — so a single-event renderer can no longer be handed a batch and silently render only the first. Renderers also receive the actor, snapshotted onto the row at notify time so it survives a rename or deletion.
