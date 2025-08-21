---
'@baseplate-dev/project-builder-cli': patch
---

Add unified project resolver system with project name support across all CLI commands. Users can now reference projects by their package.json name instead of full directory paths. Includes new `projects list` command and automatic discovery of example projects via INCLUDE_EXAMPLES environment variable. All commands (serve, diff, templates extract, snapshot) now support both project names and directory paths.
