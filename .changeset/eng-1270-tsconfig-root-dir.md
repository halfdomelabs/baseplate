---
'@baseplate-dev/core-generators': patch
---

Generated `tsconfig.json` files now set `compilerOptions.rootDir` to `src` by default, so TypeScript no longer needs to infer it and package builds get a consistent output layout.
