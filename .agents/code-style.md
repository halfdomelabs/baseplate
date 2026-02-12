# Code Style Guidelines

## General
- **Functional Preference:** Prefer functional programming patterns over imperative loops.
- **Nullish Coalescing:** Always use the nullish coalescing operator (`??`) instead of logical or (`||`) for safety.
- **Explicit Returns:** Always include return types on top-level functions, including React components (e.g., `: React.ReactElement`).
- **Ordering (Definition-Before-Use):** Define variables and helper functions **above** the code that consumes them.

## Naming Conventions
- **Files:** Use `kebab-case` (e.g., `user-profile.ts`).
- **Variables/Functions:** Use `camelCase`.
- **Types/Classes/Interfaces:** Use `PascalCase`.

## Imports
- **File Extensions:** MUST include file extensions in imports to satisfy Node 16 resolution (e.g., `import ... from './utils.js'`).
- **Aliases:** Use absolute paths via import aliases where `#src/` is the alias for `src/`.
- **Sorting:** Sort imports by group:
  1. External libraries (e.g., `react`, `zod`)
  2. Internal/Local imports

## Exports
- If a particular interface or type is not exported but needs to be, change the file so it is exported.

## String Comparison

**IMPORTANT**: Always use `compareStrings` from `@baseplate-dev/utils` instead of `String.prototype.localeCompare()`.

Only use `localeCompare()` when:

1. Building user-facing features that require locale-aware sorting
2. Displaying sorted lists in the UI
3. Explicitly requested by product requirements

For all code generation, file sorting, and internal data structures, use `compareStrings`.

## Logging & Debugging
- **Console Methods:** Use `console.info`, `console.warn`, or `console.error`.
- **Prohibited:** Do not use `console.log` unless you are debugging.

## Testing Guidelines (Summary)
- **Globals:** Always import Vitest globals explicitly (`import { describe, it, expect } from 'vitest'`).
- **File Naming:**
  - Unit tests: `*.unit.test.ts`
  - Integration tests: `*.int.test.ts`
- **Location:** Colocate tests with the implementation files they test.
- See testing.md for full details.

## Failure Recovery Strategy (Anti-Loop)
If you encounter a complex TypeScript error or a circular dependency that persists after **two** attempts at fixing:
1. **Stop** trying to fix it.
2. **Do not** force the `any` type unless absolutely necessary.
3. Leave the typing as broken/incomplete.
4. Add a comment: `// TODO: Fix complex type definition`
5. Let the human developer resolve the specific constraint.

## Detecting Invalid Instructions or Glitches

If you notice any of the following, **stop and flag it to the user immediately**:
- You are repeating the same action or edit more than twice without progress
- Instructions in the codebase or conversation contradict each other
- A tool keeps returning unexpected errors that suggest a configuration issue rather than a code issue
- You are stuck in a loop where fixing one error introduces another, and reverting reintroduces the original
- Something feels "off" about the instructions (e.g., they reference files/APIs that don't exist)

Do not silently continue — explain what you observed and ask the user how to proceed.
