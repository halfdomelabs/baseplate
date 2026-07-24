---
'@baseplate-dev/core-generators': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/plugin-auth': patch
---

Refined the ESLint template for generated apps: dropped `@typescript-eslint/explicit-function-return-type` for React components (kept for non-React TypeScript, where it remains load-bearing) and removed `@typescript-eslint/prefer-destructuring`; switched from `eslint-plugin-unicorn`'s `recommended` preset to its `unopinionated` preset while retaining the rules that matter for this codebase (`consistent-function-scoping`, `filename-case`, `no-for-loop`), and moved `filename-case` enforcement to apply to all generated apps rather than only React ones; added `@typescript-eslint/switch-exhaustiveness-check` to catch new union members silently falling into a generic `default` case; disabled `react/prop-types` for TSX files as redundant with TypeScript prop typing; and enabled `reportUnusedDisableDirectives`/`reportUnusedInlineConfigs` as warnings to surface stale ESLint directives.
