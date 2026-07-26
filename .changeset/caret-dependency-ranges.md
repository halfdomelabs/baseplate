---
'@baseplate-dev/utils': patch
---

Published packages now declare their runtime `dependencies` with caret (`^`) version ranges instead of exact pins, matching standard npm ecosystem convention and allowing consumers to dedupe transitive dependencies. `devDependencies` remain exact-pinned for reproducibility.
