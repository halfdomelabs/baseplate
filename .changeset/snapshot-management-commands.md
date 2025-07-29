---
'@baseplate-dev/project-builder-cli': patch
'@baseplate-dev/project-builder-server': patch
---

Add comprehensive snapshot management CLI commands for granular control of project differences

This adds a complete suite of snapshot commands to manage persistent differences between generated and working codebases:

**New Commands:**

- `baseplate snapshot save <project-directory> <app>` - Save snapshot of current differences (with confirmation prompt)
- `baseplate snapshot add <project-directory> <app> <files...>` - Add specific files to snapshot tracking
- `baseplate snapshot add --deleted <project-directory> <app> <files...>` - Mark files as intentionally deleted
- `baseplate snapshot remove <project-directory> <app> <files...>` - Remove files from snapshot tracking
- `baseplate snapshot show <project-directory> <app>` - Display current snapshot contents

**Features:**

- Granular file-level snapshot management following established CLI patterns
- Integration with existing snapshot storage system (`.baseplate-snapshot/` directory)
- Automatic snapshot directory resolution with `--snapshot-dir` option
- Comprehensive error handling and user confirmation for destructive operations
- Support for tracking both modified and intentionally deleted files

These commands enable the generator development workflow described in the design doc, allowing developers to maintain persistent baselines of expected differences while iterating on generator templates.
