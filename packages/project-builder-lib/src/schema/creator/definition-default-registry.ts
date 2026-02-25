import type { z } from 'zod';

/**
 * Metadata stored on a schema node annotated by `withDefault`.
 *
 * During serialization, `cleanDefaultValues()` walks the schema and uses this
 * metadata to identify and remove values that match their defaults.
 */
interface DefaultSchemaMeta {
  readonly defaultValue: unknown;
}

/**
 * Registry that stores default-value metadata on Zod schema instances.
 *
 * Uses a WeakMap to avoid interfering with Zod's type system.
 * Annotated by `withDefault()`; read by `cleanDefaultValues()`.
 */

export const definitionDefaultRegistry = (() => {
  const map = new WeakMap<z.ZodType, DefaultSchemaMeta>();
  return {
    set(schema: z.ZodType, meta: DefaultSchemaMeta): void {
      map.set(schema, meta);
    },
    get(schema: z.ZodType): DefaultSchemaMeta | undefined {
      return map.get(schema);
    },
  };
})();
