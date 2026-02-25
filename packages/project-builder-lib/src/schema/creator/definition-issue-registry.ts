import type { z } from 'zod';

import type { ReferencePath } from '#src/references/types.js';

import type { DefinitionIssue } from './definition-issue-types.js';

/**
 * Context passed to field-level issue checker functions during schema+data walk.
 * Contains only the path — field-level checkers operate on local values without rootData.
 */
export interface FieldIssueCheckerContext {
  /** The absolute path to the current node in the data */
  readonly path: ReferencePath;
}

/**
 * A field-level issue checker registered on a schema node.
 * Invoked during `collectFieldIssues()` to find problems in the local value.
 */
export type DefinitionFieldIssueChecker<T = unknown> = (
  value: T,
  ctx: FieldIssueCheckerContext,
) => DefinitionIssue[];

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
 * z.object({ ... }).apply(withIssueChecker<MyType>((value, ctx) => {
 *   const issues: DefinitionIssue[] = [];
 *   if (someCondition) {
 *     issues.push({ message: '...', path: ctx.path, severity: 'error' });
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
