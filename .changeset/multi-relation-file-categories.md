---
'@baseplate-dev/plugin-storage': minor
---

Support multi-relation file categories

- File categories are now first-class entities at the plugin definition level instead of inline on each transformer
- Categories support `referencedByRelations` (array) instead of single `referencedByRelation`, allowing multiple models to share a category
- Added `disableAutoCleanup` flag on categories to opt out of automatic file cleanup
- File model updated: `pendingUpload` boolean replaces `referencedAt` timestamp, `size` is now nullable, `expiredAt` removed
- Added file category editor UI in the storage plugin configuration
- Transformer form simplified to select from defined categories via `categoryRef`
- Migration v3 automatically extracts inline categories to plugin-level entities
