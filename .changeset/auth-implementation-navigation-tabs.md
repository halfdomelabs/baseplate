---
'@baseplate-dev/plugin-auth': patch
---

Add AuthConfigTabs navigation to all auth implementation plugins

- Update local-auth, auth0, and placeholder-auth auth-definition-editors to use shared AuthConfigTabs component
- Implement consistent tabbed navigation across all auth plugin implementations
- Maintain same layout structure with fixed-position tabs and proper overflow handling
- Users can now easily navigate between main auth config and implementation-specific configurations
- All implementation plugins now follow the same UI pattern for consistency
