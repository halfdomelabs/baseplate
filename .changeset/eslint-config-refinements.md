---
'@baseplate-dev/core-generators': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/tools': patch
---

Refined the ESLint config for generated apps, and brought the internal monorepo configs in line with it. `eslint-plugin-unicorn` now uses its `unopinionated` preset while retaining `consistent-function-scoping`, `filename-case`, and `no-for-loop`, with `filename-case` applying to all generated apps rather than only React ones; `@typescript-eslint/switch-exhaustiveness-check` catches new union members silently falling into a generic `default` case; `react/prop-types` is disabled as redundant with TypeScript prop typing; `@typescript-eslint/explicit-function-return-type` no longer applies to React components (it remains load-bearing elsewhere) and `@typescript-eslint/prefer-destructuring` was removed. Unused ESLint disable directives and inline configs are now reported.
