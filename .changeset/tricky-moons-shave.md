---
'@baseplate-dev/core-generators': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/sync': patch
---

Template extraction now resolves imports of a generated sibling package back to the import provider that owns them, and skips files the project has snapshotted as diverged, so apps sourcing their UI components from a shared library can have their templates extracted.
