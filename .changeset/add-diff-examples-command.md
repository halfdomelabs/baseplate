---
'@baseplate-dev/project-builder-dev': patch
'@baseplate-dev/project-builder-server': patch
---

Add a `diff-examples` command (and `pnpm check:examples` now runs it first) to catch example projects that are out of sync with the generators before pushing, instead of only finding out from CI.
