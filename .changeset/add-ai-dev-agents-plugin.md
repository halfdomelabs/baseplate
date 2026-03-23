---
'@baseplate-dev/plugin-ai': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-common': patch
---

Add AI development agents plugin that generates AGENTS.md, .agents/ directory, and conditionally CLAUDE.md for Baseplate projects. Also adds `rootCompilerSpec` to enable plugins to contribute generators to the monorepo root package.
