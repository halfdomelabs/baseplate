---
'@halfdomelabs/core-generators': patch
'@halfdomelabs/create-project': patch
'@halfdomelabs/tools': patch
---

Upgrade PNPM to 10.6.5

Breaking Change: See https://github.com/pnpm/pnpm/releases/tag/v10.0.0 for
breaking changes to PNPM

This breaks certain things such as lifecycle scripts and hoisting of
ESLint/Prettier plugins and so should be observed carefully.
