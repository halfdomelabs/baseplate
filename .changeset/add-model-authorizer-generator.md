---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-server': patch
---

Add prisma-model-authorizer generator that produces model authorizer files from authorizer role configuration

- New `prisma/prisma-model-authorizer` generator in fastify-generators
- Expression codegen utility to transform DSL expressions to TypeScript code
- Compiler wiring to instantiate generator per model with authorizer roles
