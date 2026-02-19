import type { z } from 'zod';

import { isEqual } from 'es-toolkit';

import type { ReferencePath } from '#src/references/types.js';
import type { DefaultSchemaMeta } from '#src/schema/creator/definition-default-registry.js';

import { definitionDefaultRegistry } from '#src/schema/creator/definition-default-registry.js';

import { walkSchemaWithData } from './schema-walker.js';

/**
 * Walks schema+data to collect default metadata, then recursively cleans the
 * data by removing values that match their registered defaults.
 *
 * Returns a new object with default-matching values removed, or the original
 * reference if nothing was changed.
 */
export function cleanDefaultValues<T>(schema: z.ZodType, data: T): T {
  if (typeof data !== 'object' || data === null) return data;

  // Phase A: Walk schema+data to collect paths that have default metadata
  const defaults = new Map<string, DefaultSchemaMeta>();

  walkSchemaWithData(schema, data, [
    {
      visit(schemaNode, _value, ctx) {
        const meta = definitionDefaultRegistry.get(schemaNode);
        if (meta) {
          defaults.set(ctx.path.join('.'), meta);
        }
        return undefined;
      },
    },
  ]);

  if (defaults.size === 0) return data;

  // Phase B: Recursively clean the data, returning undefined for stripped nodes
  const result = cleanNode(data, [], defaults);
  return result as T;
}

/**
 * Recursively cleans data by stripping values that match registered defaults.
 *
 * Recurses into children first, then compares the cleaned result to this node's
 * registered default. This means cascading happens naturally: if cleaning
 * children produces a result that matches the parent's default, the parent is
 * also stripped. The operation is fully reversible via `.prefault()`.
 *
 * Returns `undefined` to signal the value should be removed.
 */
function cleanNode(
  value: unknown,
  path: ReferencePath,
  defaults: Map<string, DefaultSchemaMeta>,
): unknown {
  let result = value;

  // Recurse into objects
  if (
    typeof value === 'object' &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    let changed = false;
    const cleaned: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const childResult = cleanNode(v, [...path, k], defaults);
      if (childResult !== v) changed = true;
      if (childResult !== undefined) {
        cleaned[k] = childResult;
      }
    }

    result = changed ? cleaned : value;
  }

  // Recurse into arrays — elements are cleaned in place but never removed,
  // since removing an element would shift indices and change the data semantically.
  if (Array.isArray(value)) {
    let changed = false;
    const cleaned: unknown[] = [];

    for (const [i, item] of value.entries()) {
      const childResult = cleanNode(item, [...path, i], defaults);
      if (childResult !== item) changed = true;
      cleaned.push(childResult);
    }

    result = changed ? cleaned : value;
  }

  // After recursion, check if the (possibly cleaned) result matches this
  // node's registered default. Only exact matches are stripped so the
  // operation is fully reversible via .prefault().
  const meta = defaults.get(path.join('.'));
  if (meta && isEqual(result, meta.defaultValue)) {
    return undefined;
  }

  return result;
}
