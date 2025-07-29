---
'@baseplate-dev/project-builder-web': patch
---

Add support for managed plugins in the UI

- Filter managed plugins from main plugin sections (Active/Available)
- Add new "Managed Plugins" section that groups plugins by their manager
- Show manager plugin name for each managed plugin group
- Update PluginCard to handle managed plugins with special configure behavior
- For managed plugins, "Configure" button redirects to manager plugin's config page
- Managed plugins show "Managed" or "Disabled" state instead of enable/disable buttons
