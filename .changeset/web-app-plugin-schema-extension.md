---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/plugin-notifications': patch
---

Web app per-app plugin settings (upload components, notifications) are now contributed by their plugins through a generic extension point and stored under `pluginData` on the web app config, instead of hardcoded flags on the core web app schema. The web app settings page renders these toggles only when the owning plugin is enabled. Existing projects are migrated automatically, preserving any enabled toggles; the unused `includeAuth` flag is removed.
