import type { z } from 'zod';

import type { ReferencePath } from '#src/references/types.js';

import { getSchemaChildren } from './schema-structure.js';

/**
 * Context passed to the transform callback at each schema node.
 */
interface SchemaTransformContext {
  /** The absolute path to the current node in the data. */
  readonly path: ReferencePath;
  /** The Zod schema at this node. */
  readonly schema: z.ZodType;
}

/**
 * A transform function called at each schema node after children have
 * already been transformed. Returns the (possibly new) value for this node.
 * Return the input value unchanged to signal "no change".
 *
 * Returning `undefined` signals that the value should be removed (for object
 * keys) or kept in place (for array elements).
 */
export type SchemaTransformFn = (
  value: unknown,
  ctx: SchemaTransformContext,
) => unknown;

/**
 * Walks a Zod schema in parallel with data, applying a transform function
 * bottom-up. Children are transformed first, then the parent transform
 * sees the already-transformed children.
 *
 * Returns a new data tree with transformations applied. Preserves object
 * references when no changes occur in a subtree (structural sharing).
 *
 * Transform semantics for `undefined` returns:
 * - Object keys: the key is omitted from the result
 * - Array elements: `undefined` is kept in place (indices must be preserved)
 */
export function transformDataWithSchema<T>(
  schema: z.ZodType,
  data: T,
  transform: SchemaTransformFn,
): T {
  return transformNode(schema, data, [], transform) as T;
}

function transformNode(
  schema: z.ZodType,
  data: unknown,
  path: ReferencePath,
  transform: SchemaTransformFn,
): unknown {
  // Step 1: Structural descent — recurse into children first (bottom-up).
  let childResult: unknown = data;

  const children = getSchemaChildren(schema, data, path);
  switch (children.kind) {
    case 'leaf': {
      break;
    }
    case 'leaf-union': {
      break;
    }
    case 'wrapper': {
      if (children.skipIfNullish && (data === undefined || data === null))
        break;
      childResult = transformNode(children.innerSchema, data, path, transform);
      break;
    }
    case 'object': {
      if (data === null || data === undefined || typeof data !== 'object')
        break;
      const obj = data as Record<string, unknown>;
      let changed = false;
      const entries: [string, unknown][] = [];

      for (const [key, fieldSchema] of children.entries) {
        const original = obj[key];
        const transformed = transformNode(
          fieldSchema,
          original,
          [...path, key],
          transform,
        );
        if (transformed !== original) changed = true;
        entries.push([key, transformed]);
      }

      if (changed) {
        // Spread original first to preserve keys not in schema shape,
        // then overlay transformed entries.
        const result: Record<string, unknown> = { ...obj };
        for (const [key, value] of entries) {
          if (value === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete result[key];
          } else {
            result[key] = value;
          }
        }
        childResult = result;
      }
      break;
    }
    case 'array': {
      if (!Array.isArray(data)) break;
      let changed = false;
      const items: unknown[] = [];

      for (const [i, datum] of data.entries()) {
        const transformed = transformNode(
          children.elementSchema,
          datum,
          [...path, i],
          transform,
        );
        if (transformed !== datum) changed = true;
        items.push(transformed);
      }

      if (changed) {
        childResult = items;
      }
      break;
    }
    case 'tuple': {
      if (!Array.isArray(data)) break;
      let changed = false;
      const resultItems: unknown[] = [];

      for (const [i, itemSchema] of children.items.entries()) {
        if (i < data.length) {
          const transformed = transformNode(
            itemSchema,
            data[i],
            [...path, i],
            transform,
          );
          if (transformed !== data[i]) changed = true;
          resultItems.push(transformed);
        }
      }

      // Transform rest elements if the tuple has a rest schema
      if (children.rest) {
        for (let i = children.items.length; i < data.length; i++) {
          const transformed = transformNode(
            children.rest,
            data[i],
            [...path, i],
            transform,
          );
          if (transformed !== data[i]) changed = true;
          resultItems.push(transformed);
        }
      }

      if (changed) {
        childResult = resultItems;
      }
      break;
    }
    case 'record': {
      if (data === null || data === undefined || typeof data !== 'object')
        break;
      const obj = data as Record<string, unknown>;
      let changed = false;
      const entries: [string, unknown][] = [];

      for (const [key, value] of Object.entries(obj)) {
        const transformed = transformNode(
          children.valueSchema,
          value,
          [...path, key],
          transform,
        );
        if (transformed !== value) changed = true;
        entries.push([key, transformed]);
      }

      if (changed) {
        childResult = Object.fromEntries(entries);
      }
      break;
    }
    case 'discriminated-union': {
      if (children.match) {
        childResult = transformNode(children.match, data, path, transform);
      }
      break;
    }
    case 'intersection': {
      // Transform left first, then transform the result via right
      const leftResult = transformNode(children.left, data, path, transform);
      childResult = transformNode(children.right, leftResult, path, transform);
      break;
    }
  }

  // Step 2: Apply transform to the (already-transformed) child result.
  return transform(childResult, { path, schema });
}
