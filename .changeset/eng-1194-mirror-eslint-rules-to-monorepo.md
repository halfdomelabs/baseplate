---
'@baseplate-dev/tools': patch
---

Brought the internal monorepo ESLint/oxlint configs in line with the refined generated-app template: switched `eslint-plugin-unicorn`'s `recommended` preset to `unopinionated` (retaining `consistent-function-scoping`, `filename-case`, and adding `no-for-loop`), consolidated `filename-case` to apply repo-wide rather than only to React packages, added `@typescript-eslint/switch-exhaustiveness-check`/`typescript/switch-exhaustiveness-check` to catch new union members silently falling into a generic `default` case, disabled `react/prop-types` as redundant with TypeScript prop typing, and promoted unused ESLint disable directives and inline configs to errors.
