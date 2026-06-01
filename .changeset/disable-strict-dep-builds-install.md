---
'@baseplate-dev/sync': patch
'@baseplate-dev/project-builder-dev': patch
---

Disable pnpm strictDepBuilds for Baseplate-run installs so generation and e2e
`pnpm install` do not fail on unreviewed dependency build scripts in freshly
generated projects
