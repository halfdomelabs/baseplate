---
'@baseplate-dev/project-builder-server': patch
---

The generated turbo.json typecheck task now depends on ^build, so typechecking a package waits for its workspace dependencies to be built instead of failing on a clean checkout.
