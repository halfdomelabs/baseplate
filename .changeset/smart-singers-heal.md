---
'@halfdomelabs/sync': patch
---

Refactor merging to use merging algorithms to allow broader flexibility:

- Introduce merge algorithms (diff3, JSON, simple diff)
- Add composite merge algorithm for chaining multiple merge strategies
- Enhance configuration options to support custom merge algorithms
