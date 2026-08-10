---
'@baseplate-dev/plugin-ai': patch
'@baseplate-dev/plugin-storage': patch
---

Plugins can now contribute their own `.agents/<id>.md` reference doc, linked from the generated `AGENTS.md`; the storage plugin uses this to document how to configure file categories when file categories are configured.
