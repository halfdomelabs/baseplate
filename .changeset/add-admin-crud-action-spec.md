---
'@baseplate-dev/project-builder-lib': patch
---

Add admin CRUD action specification system

Adds a new plugin specification system that allows plugins to register custom table actions for admin CRUD sections. This provides the foundation for plugins to contribute actions like "Manage Roles" to generated admin tables.

- Created `AdminCrudActionSpec` plugin specification
- Added base action types and schemas for registration
- Implemented built-in edit and delete action types
- Extended admin CRUD section schema to include optional actions array
- Provides type-safe action registration with authorization and model targeting support
