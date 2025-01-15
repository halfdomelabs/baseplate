---
'@halfdomelabs/baseplate-plugin-storage': minor
'@halfdomelabs/project-builder-server': minor
'@halfdomelabs/project-builder-test': minor
'@halfdomelabs/project-builder-cli': minor
'@halfdomelabs/project-builder-lib': minor
'@halfdomelabs/fastify-generators': minor
'@halfdomelabs/react-generators': minor
'@halfdomelabs/core-generators': minor
'@halfdomelabs/code-morph': minor
'@halfdomelabs/sync': minor
---

Refactor generators to pass instantiated generator directly to engine instead of intermediate JSON. Note: This means deleting any descriptor JSON files from the baseplate folder for each app as they are no longer used.
