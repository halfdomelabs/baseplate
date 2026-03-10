import type { z } from 'zod';

import type { DefinitionIssue } from './definition-issue-types.js';

/**
 * A field-level issue checker result.
 *
 * The `path` is relative to the schema node the checker is registered on.
 * The infrastructure (`collectFieldIssues`) handles scoping to the correct
 * entity and prepending the entity-relative path.
 */
export type FieldIssueResult = Pick<
  DefinitionIssue,
  'message' | 'path' | 'severity' | 'fix'
>;

/**
 * A field-level issue checker registered on a schema node.
 * Invoked during `collectFieldIssues()` to find problems in the local value.
 *
 * Returns issues with paths relative to the current schema node.
 * The infrastructure handles entity scoping automatically.
 */
export type DefinitionFieldIssueChecker<T = unknown> = (
  value: T,
) => FieldIssueResult[];

/**
 * Metadata stored on a schema node annotated by `withIssueChecker`.
 * Exposed as readonly; the registry manages mutation internally.
 */
export interface FieldIssueCheckerSchemaMeta {
  readonly checkers: readonly DefinitionFieldIssueChecker[];
}

/** Mutable internal representation used by the registry. */
interface MutableFieldIssueCheckerSchemaMeta {
  checkers: DefinitionFieldIssueChecker[];
}

/**
 * Registry that stores field-level issue checker metadata on Zod schema instances.
 *
 * Uses a WeakMap to avoid interfering with Zod's type system.
 * Annotated by `withIssueChecker()`; read by `collectFieldIssues()`.
 */
export const definitionFieldIssueRegistry = (() => {
  const map = new WeakMap<z.ZodType, MutableFieldIssueCheckerSchemaMeta>();
  return {
    add(schema: z.ZodType, checker: DefinitionFieldIssueChecker): void {
      const existing = map.get(schema);
      if (existing) {
        existing.checkers.push(checker);
      } else {
        map.set(schema, { checkers: [checker] });
      }
    },
    get(schema: z.ZodType): FieldIssueCheckerSchemaMeta | undefined {
      return map.get(schema);
    },
  };
})();

/**
 * Creates a schema decorator that registers a field-level issue checker.
 *
 * Used with `.apply()`:
 * ```typescript
 * z.object({ ... }).apply(withIssueChecker<MyType>((value) => {
 *   const issues: FieldIssueResult[] = [];
 *   if (someCondition) {
 *     issues.push({ message: '...', path: ['fieldName'], severity: 'error' });
 *   }
 *   return issues;
 * }))
 * ```
 *
 * @param checker - The issue checker function to register
 * @returns A function that decorates a schema with the checker
 */
export function withIssueChecker<T extends z.ZodType>(
  checker: DefinitionFieldIssueChecker<z.output<T>>,
): (schema: T) => T {
  return (schema: T): T => {
    definitionFieldIssueRegistry.add(
      schema,
      checker as DefinitionFieldIssueChecker,
    );
    return schema;
  };
}
