---
'@baseplate-dev/core-generators': patch
---

Removed the `preinstall: npx only-allow pnpm` script from generated `package.json` files. Package manager enforcement is already handled via the `packageManager` field, making this script redundant.
