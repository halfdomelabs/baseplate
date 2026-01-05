---
'@baseplate-dev/react-generators': minor
---

Migrate GraphQL codegen from graphql-codegen to gql.tada

- Replace separate `.gql` files and generated `graphql.tsx` with inline `graphql()` template literals
- Add gql.tada TypeScript plugin for automatic type generation via `graphql-env.d.ts`
- Add `@graphql-eslint/eslint-plugin` with naming convention rules for operations and fragments
- Colocate fragments with their consuming components using `ComponentName_field` naming pattern
- Use `readFragment()` and `FragmentOf<>` for proper fragment masking
- Extract shared queries to dedicated `queries.ts` files to avoid circular imports
