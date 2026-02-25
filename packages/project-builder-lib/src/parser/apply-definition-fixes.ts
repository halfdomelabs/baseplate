import type { z } from 'zod';

import { definitionFixRegistry } from '#src/schema/creator/definition-fix-registry.js';

import { transformDataWithSchema } from './transform-data-with-schema.js';

/**
 * Walks schema+data bottom-up, applying registered fix functions to produce
 * a new data object. Children are fixed before parents, so parent fixes
 * see the already-fixed child values.
 *
 * Applied during the save pipeline after producing changes but before
 * `fixRefDeletions`.
 *
 * Returns the original reference if no fixes were needed.
 */
export function applyDefinitionFixes<T>(schema: z.ZodType, data: T): T {
  return transformDataWithSchema(schema, data, (value, ctx) => {
    const meta = definitionFixRegistry.get(ctx.schema);
    if (!meta) return value;

    let current = value;
    for (const fix of meta.fixes) {
      current = fix(current, { path: ctx.path });
    }
    return current;
  });
}
