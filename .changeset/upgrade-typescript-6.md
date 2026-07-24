---
'@baseplate-dev/core-generators': patch
---

Upgrade TypeScript to 6.0.3 in generated projects (from 5.9.3), with typescript-eslint bumped to 8.65.0, @vitest/eslint-plugin to 1.6.23, and eslint-plugin-perfectionist to 5.10.0 for TypeScript 6 compatibility. Generated React apps now include `"types": ["node"]` in `tsconfig.app.json` since TypeScript 6 no longer implicitly includes `@types/node` globals for composite builds.
