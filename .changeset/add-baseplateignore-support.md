---
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-cli': patch
---

Add .baseplateignore support to diff command

Enhance the `baseplate diff` command to support ignore patterns via a `.baseplateignore` file, similar to `.gitignore`. This reduces noise in diff output by filtering out expected differences like environment files, logs, and build artifacts.

Features:

- Uses `.baseplateignore` file in project root with gitignore-style syntax
- Includes sensible default patterns (.env, \*.log, node_modules/, dist/, build/, .DS_Store, Thumbs.db)
- Can be disabled with `--no-ignore-file` flag
- Backward compatible (enabled by default)
- Graceful fallback when `.baseplateignore` doesn't exist
