---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/project-builder-web': patch
---

Refactor plugin migration system to separate config and project definition changes

Previously, plugin migrations had mixed responsibilities - both transforming plugin config and mutating the project definition in the same unclear contract. This made the system hard to test and reason about.

**New Migration Interface:**

- `PluginMigrationResult` with explicit `updatedConfig` and `updateProjectDefinition` properties
- Clear separation between config transformations and project definition updates
- Better type safety and testability

**Schema Version Bug Fix:**

- Fixed bug where enabling plugins via UI didn't set `configSchemaVersion`
- Plugin card now uses `PluginUtils.setPluginConfig` to automatically set correct schema version
- Prevents unnecessary migrations when enabling new plugins

**Migration Updates:**

- All existing migrations updated to use new interface
- Auth plugin migration: simple config-only transformation
- Storage plugin migrations: migration #1 (config-only), migration #2 (config + project updates)
