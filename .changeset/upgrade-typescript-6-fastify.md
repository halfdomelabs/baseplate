---
'@baseplate-dev/fastify-generators': patch
---

Support TypeScript 6 in generated backends: bump `vitest-mock-extended` to 3.1.1 for TypeScript 6 peer compatibility; explicitly set `rootDir: "src"` on the backend `tsconfig.json` since TypeScript 6 now errors (`TS5011`) instead of silently inferring the common source root, which previously kept build output flattened under `dist/`; add `"types": ["node"]` so ESLint's default-project fallback for root-level config files like `prisma.config.ts` can resolve `@types/node` again under TypeScript 6; and remove a few now-redundant type assertions surfaced by TypeScript 6's improved inference.
