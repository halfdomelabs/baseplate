---
'@baseplate-dev/core-generators': patch
'@baseplate-dev/tools': patch
'@baseplate-dev/sync': patch
'@baseplate-dev/create-project': patch
---

Upgrade vitest to 4.0.16

- vitest: 3.2.4 → 4.0.16
- @vitest/eslint-plugin: 1.3.4 → 1.6.5

Breaking changes addressed:
- Updated `UserConfig` type to `ViteUserConfig` in vitest config files
- Fixed mock type annotations for vitest 4.0 compatibility
