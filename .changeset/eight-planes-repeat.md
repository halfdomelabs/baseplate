---
'@baseplate-dev/plugin-notifications': patch
---

The notification outbox is now an internal service reached only by the delivery and sweep workers, and the renderer and event emitter are constructed inline rather than exposed on the service context.
