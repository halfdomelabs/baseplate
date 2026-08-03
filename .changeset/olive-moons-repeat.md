---
'@baseplate-dev/tools': patch
---

Replaced the `./prettier-node` and `./prettier-react` config exports with `./oxfmt-config-base` and `./oxfmt-config-react`, and the shared ESLint config now recognises `oxfmt.config.ts` as a root-level config file.
