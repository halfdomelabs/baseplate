---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/project-builder-cli': patch
---

Remove redundant `.optional()` from `withDefault` and add `testing` export

- Remove unnecessary `.optional()` wrapper from `withDefault` — Zod's `prefault` already handles optional input, making fields with defaults always present in the output type
- Add `@baseplate-dev/project-builder-lib/testing` export with reusable test helpers: `createEmptyParserContext`, `createTestModel`, `createTestScalarField`, `createTestRelationField`, `createTestUniqueConstraint`, and expression stub parsers
- `createTestModel` now parses input through the Zod schema to automatically populate all defaults, removing the need to manually specify `relations`, `uniqueConstraints`, `graphql`, `authorizer`, etc.
- Fix `adminApp` presence checks across web routes and server compilers to reflect that `adminApp` is now always defined (checking `adminApp.enabled` instead of `!adminApp`)
