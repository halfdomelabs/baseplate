---
'@baseplate-dev/plugin-storage': patch
---

Refactor storage plugin file category system to use registry-based pattern

This change modernizes the file category system by moving from a centralized configuration array to a modular registry-based pattern with individual category files. Key improvements include:

**New Architecture:**

- Individual category files for better modularity and maintainability
- `createFileCategory` utility with FileSize and MimeTypes helpers
- Registry pattern with `FILE_CATEGORY_REGISTRY` for type-safe category lookup
- GraphQL enum type for file categories with strict validation

**Enhanced Features:**

- If-None-Match header support for S3 uploads to prevent file overwrites
- Improved authorization patterns with separate upload/read permissions
- Better error messages and validation feedback
- Type-safe category name validation using CONSTANT_CASE convention

**Breaking Changes:**

- File categories are now imported from individual files instead of centralized array
- GraphQL schema now uses enum type instead of string for category field
- Authorization interface updated with separate upload/read functions

**Migration:**

- Existing file categories are preserved with same functionality
- Services updated to use new registry lookup functions
- Database schema remains compatible
