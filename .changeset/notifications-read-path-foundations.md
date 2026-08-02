---
'@baseplate-dev/plugin-notifications': patch
---

The notification feed is now cursor-paginated via a `notificationFeed` connection, so rows are no longer skipped or repeated when a notification arrives between page fetches.
