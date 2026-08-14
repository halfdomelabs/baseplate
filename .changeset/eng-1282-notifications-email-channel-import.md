---
'@baseplate-dev/plugin-notifications': patch
---

The generated notifications email channel no longer hardcodes an import from an unrelated example project's transactional-email package; it now resolves the import from your project's own transactional library, matching how the rest of the file's email imports already worked.
