---
'@baseplate-dev/plugin-ai': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/plugin-payments': patch
'@baseplate-dev/plugin-notifications': patch
---

Plugins can now contribute their own `.agents/<id>.md` reference doc, linked from the generated `AGENTS.md`; the storage, Stripe, and notifications plugins each use this to document how to configure file categories, billing plans, and notification topics when relevant.
