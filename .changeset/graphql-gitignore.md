---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/plugin-email': patch
---

- Add generated GraphQL files (`src/gql/*`) to `.gitignore` in generated projects
- Replace Prisma's `postinstall` hook with a cacheable `prisma:generate` Turbo prebuild task
- Make `lint`, `typecheck`, and `test` depend on prebuild tasks (`gql:generate`, `prisma:generate`) in Turbo so generated types are available in CI

**Migration:** After syncing, remove previously tracked generated GraphQL files from git:

```sh
git rm -r --cached apps/*/src/gql
```
