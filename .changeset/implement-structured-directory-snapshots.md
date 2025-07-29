---
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/sync': patch
---

Implement structured directory snapshots for baseplate diff to detect deleted files

The `baseplate diff` command now provides complete diff coverage by detecting files that exist in the working directory but not in the generated output (deleted files). This enhancement includes:

- Added `scanWorkingDirectory` function using `globby` for efficient directory traversal
- Updated `compareFiles` function to detect and report deleted files in addition to added and modified files
- Enhanced diff output to show deleted files with proper formatting and unified diffs
- Added comprehensive unit tests for the new directory scanning functionality
- Maintained compatibility with existing ignore patterns and glob filters

**New Default Ignore Patterns:**

- Added `baseplate/**/*` to ignore Baseplate configuration and project definition files
- Added `prisma/migrations/**/*` to ignore Prisma migration files that are auto-generated

This addresses the TODO in the diff implementation and provides developers with a complete picture of differences between generated and working directory files while filtering out commonly ignored directories.
