---
'@baseplate-dev/ui-components': patch
---

Toasts are now built on Base UI rather than sonner, so they stack and expand on hover, dismiss by swipe, announce errors assertively, and put their viewport on the F6 landmark cycle. They now appear bottom-right, full-width along the bottom on narrow screens, rather than top-center. `toast` is now a facade exported from the library — `message`, `success`, `warning`, `error`, `update` and `dismiss` — taking the message first and an optional `description`, `actionProps`, `priority`, `timeout` and `id`, and returning the toast's id. For custom layouts the library also exports `toastManager` alongside the toast parts, so a hand-rolled renderer still receives what `toast.*` sends. `Toaster` now takes Base UI's provider props (`timeout`, `limit`, `toastManager`), so sonner props such as `position` and `closeButton` no longer apply.
