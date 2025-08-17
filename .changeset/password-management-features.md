---
'@baseplate-dev/plugin-auth': patch
---

Add comprehensive password management capabilities to local auth plugin

Introduces robust password management functionality for both users and administrators.

**New Backend Features:**

- Added `changeUserPassword` service function for users to change their own passwords (requires current password validation)
- Added `resetUserPassword` service function for administrators to reset any user's password (no current password required)
- Implemented `changePassword` GraphQL mutation with `['user']` authorization
- Implemented `resetUserPassword` GraphQL mutation with admin authorization
- Added comprehensive password validation and error handling
- Supports creating password accounts for users who don't have password authentication configured

**New Admin UI Features:**

- Added `PasswordResetDialog` component for secure password reset functionality
- Integrated password reset action into user management table dropdown menu
- Added password confirmation field with client-side validation
- Implemented proper form validation with configurable minimum password length
- Added GraphQL code generation for new mutations

**New Generator Framework:**

- Created `adminCrudResetPasswordActionGenerator` mirroring the manage roles pattern
- Added configurable password reset actions for admin CRUD interfaces
- Supports both inline and dropdown action positioning
- Includes template variables for password requirements and user model naming
- Provides consistent integration with existing admin action containers
