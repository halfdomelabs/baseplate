---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-email': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/plugin-payments': patch
---

Add plugin dependency support: plugins can declare `pluginDependencies` in plugin.json to require other plugins. Includes circular dependency detection via toposort, definition issue checking that blocks save for unmet dependencies, UI gating that prompts users to enable/configure dependencies before enabling a plugin, and implementation plugin validation. Added dependency declarations to local-auth (email, queue, rate-limit), email (queue), and storage (queue).
