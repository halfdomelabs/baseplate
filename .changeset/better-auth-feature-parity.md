---
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/fastify-generators': patch
---

Close feature gaps between better-auth and local-auth

- Add password reset email flow, email verification flow, and email templates to better-auth
- Add admin GraphQL mutations (resetUserPassword, updateUserRoles) for better-auth
- Add forgot-password, reset-password, and verify-email frontend pages
- Add seed initial user generator using direct Prisma + hashPassword
- Add admin CRUD actions (reset password, manage roles, roles column) for better-auth
- Add built-in "admin" role that always exists and cannot be deleted
- Split `builtIn` and `autoAssigned` role flags — `autoAssigned` controls which roles are auto-added to user context (public, user, system) and should not be used in authorizer expressions
- Remove `initialUserRoles` config — seed user always gets the admin role
- Rename `userAdminRoles` to `additionalUserAdminRoles` — admin role always has user management permissions
- Add labels and reduce spacing on better-auth auth pages (login, register, forgot-password, reset-password)
- Add project definition migration (029) for existing projects
