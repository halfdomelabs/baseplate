---
'@baseplate-dev/tools': patch
---

The shared Vitest configs now exclude generator template sources at any nesting depth, so a test file inside a template directory is no longer collected and run as a real test.
