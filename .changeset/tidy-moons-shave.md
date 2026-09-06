---
'@baseplate-dev/ui-components': patch
---

Toasts are now built on Base UI instead of sonner: they stack bottom-right, swipe to dismiss and announce errors assertively. The `toast` facade takes the message first with optional `description`, `actionProps`, `priority`, `timeout` and `id`, and `Toaster` now takes Base UI provider props, so sonner options such as `position`, `closeButton` and `action` no longer apply.
