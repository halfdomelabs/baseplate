import type { z } from 'zod';

import type { ReferencePath } from '#src/references/types.js';

/**
 * Context passed to fix functions during the schema+data walk.
 * Contains only the path — fixes operate on local values without rootData access.
 */
export interface DefinitionFixContext {
  /** The absolute path to the current node in the data */
  readonly path: ReferencePath;
}

/**
 * A fix function that silently transforms a value during the save pipeline.
 * Return the fixed value, or the original value if no fix is needed.
 */
export type DefinitionFix<T = unknown> = (
  value: T,
  ctx: DefinitionFixContext,
) => T;

/**
 * Metadata stored on a schema node annotated by `withFix`.
 */
export interface FixSchemaMeta {
  readonly fixes: DefinitionFix[];
}

/**
 * Registry that stores fix metadata on Zod schema instances.
 *
 * Uses a WeakMap to avoid interfering with Zod's type system.
 * Annotated by `withFix()`; read by `applyDefinitionFixes()`.
 */
export const definitionFixRegistry = (() => {
  const map = new WeakMap<z.ZodType, FixSchemaMeta>();
  return {
    add(schema: z.ZodType, fix: DefinitionFix): void {
      const existing = map.get(schema);
      if (existing) {
        existing.fixes.push(fix);
      } else {
        map.set(schema, { fixes: [fix] });
      }
    },
    get(schema: z.ZodType): FixSchemaMeta | undefined {
      return map.get(schema);
    },
  };
})();

/**
 * Creates a schema decorator that registers a silent auto-fix.
 *
 * Used with `.apply()`:
 * ```typescript
 * z.object({ ... }).apply(withFix<MyType>((value, ctx) => fixedValue))
 * ```
 *
 * @param fix - The fix function to register
 * @returns A function that decorates a schema with the fix
 */
export function withFix<T extends z.ZodType>(
  fix: DefinitionFix<z.output<T>>,
): (schema: T) => T {
  return (schema: T): T => {
    definitionFixRegistry.add(schema, fix as DefinitionFix);
    return schema;
  };
}
