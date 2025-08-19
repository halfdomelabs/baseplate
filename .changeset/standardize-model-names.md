---
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/project-builder-lib': patch
---

Standardize data model names across auth and storage plugins

This change removes the ability for users to configure custom model names, replacing it with standardized, fixed model names extracted to plugin-specific constants files. This simplifies templates by eliminating parameterization and makes it easier to discover what models are used by each plugin.

**Breaking Changes:**

- Removed `modelRefs` configuration from plugin schemas
- Model names are now fixed: User, UserAccount, UserRole, UserSession (auth), File (storage)

**Improvements:**

- Added plugin-specific constants files for better discoverability
- Simplified UI by removing model selection components
- Enhanced ModelMergerResultAlert to show "Models Up to Date" instead of null when no changes needed
- Maintained type safety with Record types

**Migration:**

- Remove any `modelRefs` configuration from plugin definitions
- Model names will be automatically standardized to the new constants
