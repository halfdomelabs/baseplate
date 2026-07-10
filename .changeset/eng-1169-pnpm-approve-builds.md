---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/core-generators': patch
'@baseplate-dev/project-builder-server': patch
---

Fix create-project being blocked by pnpm 11 approve-builds by removing @prisma/engines from generator dependencies and setting strictDepBuilds/allowBuilds in generated pnpm-workspace.yaml.
