---
'@baseplate-dev/project-builder-lib': patch
---

Sort entity arrays by name in project-definition.json for deterministic output. Entity schemas with `sortByName: true` in their `withEnt` annotation are sorted alphabetically during serialization.
