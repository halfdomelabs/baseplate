---
'@baseplate-dev/react-generators': patch
---

The generated admin layout header now exposes an extension point for plugins to mount header actions (e.g. a notification bell) without hand-editing the layout — the slot renders empty when no plugin contributes to it, so existing generated apps are unaffected.
