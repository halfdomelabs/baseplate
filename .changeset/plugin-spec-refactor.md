---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-cli': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/create-project': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/plugin-queue': patch
---

Refactor plugin spec system with lazy initialization and clear setup/use phases

This refactoring overhauls the plugin spec system to introduce a two-phase architecture with lazy initialization:

**New Architecture:**

- **Setup phase (init)**: Plugins register their implementations during module initialization using mutable field containers
- **Use phase**: Consumers access registered items through a read-only interface, with lazy initialization on first access
- **FieldMap-based specs**: New `createFieldMapSpec` helper provides type-safe containers (maps, arrays, named arrays, scalars) with automatic source tracking

**Key changes:**

- Rename `PluginImplementationStore` to `PluginSpecStore` with cached `use()` instances
- Rename `createPlatformPluginExport` to `createPluginModule`
- Add required `name` field to all plugin modules for unique identification
- Convert all specs to use `createFieldMapSpec` with typed containers
- Update all plugin modules to use new registration methods (`.add()`, `.set()`, `.push()`)
- Introduce `ModuleContext` with `moduleKey` and `pluginKey` for better source tracking
- Specs now define both `init` (mutable setup interface) and `use` (read-only consumption interface)
