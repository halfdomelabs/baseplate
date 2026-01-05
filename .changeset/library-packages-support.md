---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/core-generators': patch
---

Add support for library packages in addition to apps

- Add `packages` array to ProjectDefinition schema with node-library type
- Add `packagesFolder` to MonorepoSettings (default: "packages")
- Create node-library generator with tsc build configuration
- Add library package compiler for code generation
- Update workspace patterns to include packages/* folder
- Add UI for creating and managing library packages in the Apps section
