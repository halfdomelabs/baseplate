---
'@baseplate-dev/react-generators': patch
---

Generated apps now define `--radius` and its full size scale, so components like `InputGroup` that depend on it render with the correct corner radius instead of square corners. Fixed the `dark` variant matcher to also activate on a bare `.dark` class, ported the `Sidebar`/`Badge`/`Alert` tone and pointer-cursor fixes from `ui-components`, and switched the root layout from a fixed `100vh` to `min-height: 100dvh`.
