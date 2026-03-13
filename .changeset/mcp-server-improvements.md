---
'@baseplate-dev/project-builder-lib': patch
---

Fix entity navigation for discriminated union array children (e.g. admin sections) by stripping leading discriminated-union-array element from relative paths in collectEntityMetadata
