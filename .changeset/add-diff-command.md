---
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-cli': patch
---

Add command to diff generated output from actual output

Adds a new `baseplate diff` command that shows the difference between what would be generated and what currently exists in the working directory. This helps developers avoid losing code when they write in generated files and then revert to test generation.

Features:

- Shows unified diff format by default
- Supports `--compact` flag for summary format with change counts
- Supports `--app` flag to filter by specific applications
- Supports `--glob` flag to filter files by glob patterns
- Handles binary files using isbinaryfile package
- Modular design with separate utilities for diffing, formatting, and comparison
