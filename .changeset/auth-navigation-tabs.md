---
'@baseplate-dev/plugin-auth': patch
---

Add NavigationTabs to auth plugin configuration page

- Implement tabbed navigation similar to model edit page
- "Auth Config" tab shows general auth settings (provider selection, roles, feature path)
- Dynamic provider tab shows selected implementation's configuration
- Tab navigation is fixed to top for better UX
- Provider tab only appears when an implementation is selected
- Tab labels dynamically update based on selected provider (e.g., "Local Auth Config", "Auth0 Config")
- Maintains all existing functionality while improving user experience
