---
'@baseplate-dev/project-builder-lib': patch
---

Refactor plugin metadata system to use single plugin.json files with configurable discovery

- Remove manifest.json support completely in favor of plugin.json files
- Add package.json-based configuration for plugin discovery patterns and web build directories
- Default to loading built plugins from dist/\*/plugin.json patterns
- Allow runtime configuration overrides for plugin discovery
- Add comprehensive test suite using memfs for realistic filesystem testing
- Update plugin packages to use new metadata system with automatic build copying
