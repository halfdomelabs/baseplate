---
'@baseplate-dev/plugin-notifications': patch
---

A notification channel set to `digest` now collapses a window's activity into one email per recipient instead of one per notification, sent by a new scheduled sweep once the window closes. This also fixes topic-level digest windows, which were configured as `windowSeconds` but read as `digestWindowSeconds` and so never applied.
