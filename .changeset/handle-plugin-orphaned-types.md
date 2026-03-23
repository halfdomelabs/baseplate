---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/project-builder-server': patch
---

Detect and block disabling plugins whose types (transformers, package types, etc.) are still in use, showing a dialog listing the affected items
