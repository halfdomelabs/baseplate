---
'@baseplate-dev/fastify-generators': patch
---

Support TypeScript 6 in generated backends: bump `vitest-mock-extended` to 3.1.1, set `rootDir`/`types` on the backend `tsconfig.json` to fix build output layout and `@types/node` resolution, and clean up now-redundant type assertions surfaced by TypeScript 6's improved inference.
