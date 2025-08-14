---
'@baseplate-dev/plugin-auth': patch
---

Add userAdminRoles configuration field to local auth plugin

Adds a new `userAdminRoles` field to the local auth plugin definition that allows configuring which roles can manage users and assign roles to other users. This provides more granular control over user management permissions in the admin interface.

- Added `userAdminRoles` field to plugin definition schema
- Updated auth module generator to use configurable admin roles instead of hard-coded 'admin' role
- Added UI configuration field in the local auth definition editor
- Maintains backward compatibility with default empty array
