---
'@baseplate-dev/code-morph': patch
'@baseplate-dev/core-generators': patch
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-email': patch
'@baseplate-dev/plugin-notifications': patch
'@baseplate-dev/plugin-payments': patch
'@baseplate-dev/plugin-queue': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/project-builder-cli': patch
'@baseplate-dev/project-builder-dev': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/sync': patch
'@baseplate-dev/utils': patch
---

Tightened handling of indexed access across the codebase, fixing latent cases where a missing array element or record entry could surface as an undefined value in a field typed as required, such as unmatched regular expression capture groups and parsed command strings.
