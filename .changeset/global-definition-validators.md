---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-web': patch
---

Add global definition validation system with fixes, issue checkers, and bottom-up schema transformation

- Introduce `withFix()` and `withIssueChecker()` schema decorators for registering fixes and issue checkers on Zod schema nodes
- Add `transformDataWithSchema()` for bottom-up schema-guided data transformation with structural sharing
- Refactor `applyDefinitionFixes` and `cleanDefaultValues` to use `transformDataWithSchema`
- Add severity levels (`error`/`warning`) to definition issues; errors block save in the global save pipeline
- Rename `walkSchemaWithData` to `walkDataWithSchema`
