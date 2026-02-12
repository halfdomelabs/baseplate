# Testing Guidelines

This file outlines the testing strategy, patterns, and constraints for the Baseplate codebase.

## General Principles

- **Clear Test Names:** Use descriptive names that explain the *intent* of the test (e.g., `should throw 'InvalidConfigError' when configuration is missing` instead of `throws error`).
- **Arrange-Act-Assert (AAA):** Structure every test clearly:
  - **Arrange:** Set up the data, mocks, and environment.
  - **Act:** Execute the function or component under test.
  - **Assert:** Verify the output or side effects.
- **Isolation:** Tests must be independent. Never rely on state (DB, file system, globals) from previous tests.
- **Public API Focus:** Test the public interface and behavior, not private implementation details.
- **Type-Safe Mocks:** Use TypeScript generics or `vi.mocked()` to ensure mocks match the implementation signature.

## Test Quantity & Quality (Judicious Testing)

- **High Value, Low Noise:** Do not generate exhaustive tests for every possible permutation. Focus on:
  - The "Happy Path" (primary success case).
  - Critical error boundaries (what happens if the API is down?).
  - Complex logic branches.
- **Avoid Trivial Tests:** Do not write tests for simple getters/setters or one-line pass-through functions unless they contain logic.
- **Performance:** Be mindful of CI speed. Prefer fewer, higher-quality integration tests over hundreds of granular, redundant unit tests.

## Refactoring for Testability

- **Safe Refactoring (Permitted):** You may export previously private types or helper functions if it makes testing significantly easier without changing logic.
- **Architectural Refactoring (Restricted):** If a component requires significant structural changes to be testable (e.g., rewriting class inheritance to dependency injection), you **MUST** ask the user for confirmation before proceeding.
  - *Example prompt:* "This function is hard to test because it is tightly coupled to X. Shall I refactor it to use dependency injection first?"

## Test Organization

- **Unit Tests:** Colocate with source files using the `.unit.test.ts` suffix.
- **Integration Tests:** Use the `.int.test.ts` suffix.
- **Test Helpers:** Place shared setup code or utilities in `src/tests/` or create `*.test-helper.ts` files.
  - Before creating mock data or test objects, check for an existing `*.test-helper.ts` or `*.test-utils.ts` file in the same package (see [Test Helper Reference](#test-helper-reference) below).
  - Example: to mock a `ProjectDefinition`, use `createTestProjectDefinition()` from `packages/project-builder-lib/src/definition/project-definition-container.test-utils.ts`.
  - If no helper exists and the mock would be useful across multiple test files, create a new `*.test-helper.ts` file following the factory function pattern (e.g., `createTest<ObjectName>()`) and add an entry to the reference table below.
- **Manual Mocks:** Place manual mocks in `src/__mocks__/`.

## Mocking Patterns

### External Services
- **Always Mock:** External API calls, databases, and system-level operations (e.g., `child_process`) must be mocked in Unit Tests.

### File System (memfs)
When testing code that interacts with the file system, use `memfs` to create a virtual in-memory drive. This prevents disk pollution and ensures speed.

**Standard Pattern:**

```typescript
import { vol } from 'memfs';
import { beforeEach, vi } from 'vitest';

// 1. Mock the node modules
vi.mock('node:fs');
vi.mock('node:fs/promises');

// 2. Reset the virtual volume before each test
beforeEach(() => {
  vol.reset();
});

test('should write configuration file', async () => {
  // Arrange
  const config = { version: 1 };
  
  // Act (calls fs.writeFile internally)
  await writeConfig(config);

  // Assert
  expect(vol.toJSON()).toEqual({
    '/cwd/config.json': JSON.stringify(config)
  });
});
```

### Using with Third-Party Libraries (globby/chokidar)

Many libraries (like globby) bypass default mocks. You MUST explicitly inject the mocked fs adapter into these libraries.

```typescript
import { globby } from 'globby';
import * as fsAdapter from 'node:fs'; // This imports the mocked version due to vi.mock()

// Correct: Pass the mocked adapter explicitly
const files = await globby(['**/*.ts'], { fs: fsAdapter });
```

## Test Helper Reference

> **When adding a new test helper file, add an entry to this table.**

| Package | File | Key Exports |
|---------|------|-------------|
| core-generators | `src/test-helpers/` (barrel) | `extendFragmentMatchers`, `createTestTsImportMap`, `tsFragmentSerializer` |
| fastify-generators | `src/test-helpers/setup.test-helper.ts` | Re-exports core-generators matchers |
| react-generators | `src/test-helpers/setup.test-helper.ts` | Re-exports core-generators matchers |
| sync | `src/runner/tests/factories.test-helper.ts` | `buildTestGeneratorBundle`, `buildTestGeneratorTaskEntry`, `buildTestGeneratorEntry` |
| sync | `src/runner/tests/dependency-entry.test-helper.ts` | `createDependencyEntry`, `createReadOnlyDependencyEntry`, `createOutputDependencyEntry` |
| sync | `src/output/string-merge-algorithms/tests/merge.test-helper.ts` | `runMergeTests` |
| sync | `src/output/builder-action-test-helpers.ts` | `createTestTaskOutputBuilder`, `testAction` |
| sync | `src/tests/logger.test-utils.ts` | `createTestLogger`, `createConsoleLogger` |
| sync | `src/templates/extractor/test-utils/plugin-test-utils.ts` | `createMockPluginApi`, `createPluginInstance` |
| ui-components | `src/tests/render.test-helper.tsx` | `renderWithProviders` |
| project-builder-lib | `src/definition/project-definition-container.test-utils.ts` | `createTestProjectDefinition`, `createTestProjectDefinitionContainer` |
| project-builder-lib | `src/schema/definition.test-helper.ts` | `createTestFeature`, `createTestModel`, `createTestScalarField` |
| project-builder-lib | `src/plugins/plugins.test-utils.ts` | `createTestPluginMetadata`, `createTestMigration` |
| project-builder-lib | `src/references/expression-stub-parser.test-helper.ts` | `stubParser`, `StubParserWithSlots` |
| code-morph | `src/morphers/tests/morpher.test-helper.ts` | `runMorpherTests` |
| project-builder-server | `src/tests/chokidar.test-helper.ts` | `MockFSWatcher`, `emitMockFsWatcherEvent` |
| project-builder-cli | `e2e/fixtures/server-fixture.test-helper.ts` | Playwright test fixtures (`test`, `addProject`) |