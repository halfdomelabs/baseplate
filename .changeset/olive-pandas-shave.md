---
'@baseplate-dev/sync': patch
'@baseplate-dev/core-generators': patch
'@baseplate-dev/react-generators': patch
---

Generated files are now formatted against the stylesheet the same sync produces, so introducing a Tailwind utility and its first usage together no longer leaves classes mis-sorted and failing `prettier --check`. Formatting also re-runs after a sync installs dependencies, so upgrading prettier or its plugins no longer leaves generated code formatted by the version being replaced.
