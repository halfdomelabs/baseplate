---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/core-generators': patch
'@baseplate-dev/project-builder-server': patch
---

Fix the create-project experience being blocked by pnpm 11's approve-builds gate:

- `fastify-generators` now formats Prisma schemas with `@prisma/prisma-schema-wasm`
  directly instead of `@prisma/internals`, removing `@prisma/engines` (and its
  install prompt) from the generator tooling closure.
- Generated projects now set `strictDepBuilds: false` in `pnpm-workspace.yaml` so an
  unapproved dependency build script downgrades from an install failure to a warning,
  and pre-populate `allowBuilds` with the build-script dependencies a generated project
  pulls in.
