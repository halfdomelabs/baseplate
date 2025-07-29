---
'@baseplate-dev/plugin-auth': major
'@baseplate-dev/project-builder-lib': minor
'@baseplate-dev/project-builder-web': minor
---

This major refactor splits the monolithic auth plugin into a managed plugin architecture:

## Plugin Structure Changes

- **Base auth plugin** (`auth`): Manages common functionality, roles, and provider selection
- **Implementation plugins** (managed):
  - `local-auth`: Email/password authentication (renamed from original `auth` plugin)
  - `auth0`: Auth0 integration
  - `placeholder-auth`: Development/testing placeholder

## Key Changes

### Plugin Metadata System

- **BREAKING**: Replace `manifest.json` with `plugin.json` for all plugins
- **BREAKING**: Rename `id` to `key` in plugin metadata for URL consistency
- Add `managedBy` field to plugin metadata for managed plugin relationships
- Implement package.json-based plugin discovery configuration

### Managed Plugin Pattern

- Implementation plugins are hidden from main plugin list
- Base plugin automatically manages lifecycle of implementation plugins
- UI shows "Managed Plugins" section grouped by manager
- Configure buttons on managed plugins redirect to manager's config page

### Configuration Schema

- Base auth plugin config includes `implementationPluginKey` to specify active provider
- Roles configuration moved to base plugin (shared across implementations)
- Provider-specific configs remain in implementation plugins

### UI Improvements

- Add tabbed navigation (`AuthConfigTabs`) across all auth plugin interfaces
- Dynamic provider selection within base plugin configuration
- Consistent UX patterns between all auth implementation plugins

### Migration Support

- Automatic migration of existing `plugin-auth` configs to new structure
- Rename existing `plugin-auth_auth` to `plugin-auth_local-auth`
- Auto-enable base auth plugin when implementation plugins are detected
- Preserve all existing configuration without code changes needed
