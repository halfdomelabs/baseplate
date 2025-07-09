---
'@baseplate-dev/sync': patch
'@baseplate-dev/core-generators': patch
'@baseplate-dev/project-builder-server': patch
---

Simplify template metadata system by consolidating template definitions in extractor.json

- Consolidate template definitions in extractor.json using template names as keys instead of file paths
- Rename .template-metadata.json to .templates-info.json with simplified instance tracking
- Remove file-id-map.json dependency and related file ID mapping logic
- Update TemplateExtractorConfigLookup to work without file ID mapping
- Update all template extractors and tests to use new metadata format
- Add migration script to convert existing extractor.json files to new format
