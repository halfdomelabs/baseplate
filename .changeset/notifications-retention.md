---
'@baseplate-dev/plugin-notifications': patch
---

Notifications and their dispatch requests are now deleted after a retention window instead of accumulating forever, so the feed, badge count, and mark-all-as-read no longer degrade as a project ages. Rows still owing a delivery are kept until it settles.
