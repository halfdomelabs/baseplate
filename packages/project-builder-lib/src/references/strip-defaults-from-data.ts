import type { z } from 'zod';

import { unset } from 'es-toolkit/compat';
import { produce } from 'immer';

import { walkSchemaWithData } from '#src/parser/schema-walker.js';
import { definitionDefaultRegistry } from '#src/schema/creator/definition-default-registry.js';

import type { ReferencePath } from './types.js';

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.values(value).every((val) => val === undefined);
  }
  if (typeof value === 'string') {
    return value === '';
  }
  return false;
}

/**
 * Walks schema+data in parallel and removes field values that match their
 * registered defaults (as annotated by `withDefault()` in 'strip' mode).
 *
 * Returns a new object with default-matching values removed.
 */
export function stripDefaultsFromData<T>(schema: z.ZodType, data: T): T {
  if (typeof data !== 'object' || data === null) return data;

  const pathsToStrip: ReferencePath[] = [];

  walkSchemaWithData(schema, data, [
    {
      visit(schemaNode, value, ctx) {
        const meta = definitionDefaultRegistry.get(schemaNode);
        if (!meta) return undefined;

        if (value === meta.defaultValue || isEmpty(value)) {
          pathsToStrip.push(ctx.path);
        }
        return undefined;
      },
    },
  ]);

  if (pathsToStrip.length === 0) return data;

  // Sort deepest paths first so that unsetting a child before its parent is safe
  const sortedPaths = pathsToStrip.toSorted((a, b) => b.length - a.length);

  return produce(data as object, (draft) => {
    for (const path of sortedPaths) {
      unset(draft, path);
    }
  }) as T;
}
