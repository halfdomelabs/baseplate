---
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-lib': patch
---

Annotate expression fields in the entity schema returned by `get-entity-schema`, so authorization expressions are identified as a DSL with a short syntax summary and a pointer to the full grammar instead of appearing as a plain string.
