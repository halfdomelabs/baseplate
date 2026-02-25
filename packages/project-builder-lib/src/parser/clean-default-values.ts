import type { z } from 'zod';

import { isEqual } from 'es-toolkit';

import { definitionDefaultRegistry } from '#src/schema/creator/definition-default-registry.js';

import { transformDataWithSchema } from './transform-data-with-schema.js';

/**
 * Walks schema+data bottom-up, removing values that match their registered
 * defaults. Children are cleaned first, so cascading happens naturally:
 * if cleaning children produces a result matching the parent's default,
 * the parent is also stripped.
 *
 * The operation is fully reversible via `.prefault()`.
 *
 * Returns a new object with default-matching values removed, or the original
 * reference if nothing was changed.
 */
export function cleanDefaultValues<T>(schema: z.ZodType, data: T): T {
  return transformDataWithSchema(schema, data, (value, ctx) => {
    const meta = definitionDefaultRegistry.get(ctx.schema);
    if (meta && isEqual(value, meta.defaultValue)) {
      return undefined;
    }
    return value;
  });
}
