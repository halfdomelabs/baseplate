---
'@baseplate-dev/tools': patch
---

The shared TypeScript configurations now enable `noUncheckedIndexedAccess`, so packages extending them will see indexed access typed as possibly undefined.
