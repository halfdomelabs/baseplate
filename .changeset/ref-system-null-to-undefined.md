---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-web': patch
---

Migrate reference system from ZodRef to transform-based architecture

- Complete migration from legacy ZodRef system to new transform-based reference processing using marker classes and schema transformations
- Implement `deserializeSchemaWithTransformedReferences` for integration testing with real-world usage patterns
- Replace `fixRefDeletions` implementation to use new transform system with `parseSchemaWithTransformedReferences`
- Add comprehensive test coverage using integration tests with `deserializeSchemaWithTransformedReferences` instead of manual marker creation
- Support for complex reference scenarios including nested references, parent-child relationships, and custom name resolvers
- Rename `SET_NULL` to `SET_UNDEFINED` and add array context detection to prevent JSON serialization issues
- Add omit pattern support to `useEnumForm` hook for consistency with `useModelForm`
