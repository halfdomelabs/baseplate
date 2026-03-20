---
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/project-builder-lib': patch
---

Add `accountsFeatureRef` field to auth plugin, separating user data models (User, UserAccount, UserRole, UserSession, AuthVerification) from auth infrastructure code. Defaults to a new `accounts` feature alongside the existing `auth` feature. Includes schema migration 029 to backfill existing projects.
