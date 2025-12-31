---
'@baseplate-dev/sync': patch
---

Add automatic cleanup of orphaned templates during extraction. When a generated file is manually deleted but its metadata still exists in `.templates-info.json`, the extraction process now automatically detects this and cleans up the orphaned template entry from `extractor.json`, the template source file, and the metadata file.
