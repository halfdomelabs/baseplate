---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/plugin-notifications': patch
---

The Apollo cache now accepts type policies contributed by generators, and the notification feed uses one so a "view all" surface can page through it without discarding the cached page. The notification panel's unread count now comes from a new `unreadNotificationCount` field instead of counting only the rows it had loaded.
