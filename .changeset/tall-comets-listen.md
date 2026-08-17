---
'@baseplate-dev/plugin-ai': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

Authorization expressions can now compare an optional field against `null` (e.g. `model.engagementEffectiveAt !== null`), including as an `exists()`/`all()` condition value, so presence-gated rules no longer have to be hand-written. Comparing a required field, or a `json` field, against `null` is flagged as a warning.
