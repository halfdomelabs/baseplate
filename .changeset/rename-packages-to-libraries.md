---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

Rename `packages` to `libraries` in project definition schema

- Renamed `packages` field to `libraries` in project definition
- Renamed `packagesFolder` to `librariesFolder` in monorepo settings with new default `libs`
- Updated entity IDs from `package:*` prefix to `library:*`
- Added migration (022) to automatically migrate existing projects
- Reorganized routes from `/apps/*` to `/packages/*` root with `/packages/apps/$key` and `/packages/libs/$key` subroutes

**Breaking change:** The default library folder has changed from `packages` to `libs`. If you have existing library packages, you will need to rename your `packages/` directory to `libs/` in your project.
