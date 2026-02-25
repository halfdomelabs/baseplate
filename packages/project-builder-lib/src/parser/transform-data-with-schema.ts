import type {
  z,
  ZodArray,
  ZodDefault,
  ZodDiscriminatedUnion,
  ZodIntersection,
  ZodNonOptional,
  ZodNullable,
  ZodObject,
  ZodOptional,
  ZodPrefault,
  ZodReadonly,
  ZodRecord,
  ZodTuple,
} from 'zod';

import type { ReferencePath } from '#src/references/types.js';

import { findDiscriminatedUnionMatch } from './schema-walker.js';

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

/** Leaf types that are allowed in a plain `z.union()` without a discriminator. */
const LEAF_UNION_TYPES = new Set(['string', 'enum', 'literal']);

/**
 * Returns `true` if every option in the union is a leaf type
 * (string, enum, or literal), meaning no structural descent is needed.
 */
function isLeafUnion(options: z.ZodType[]): boolean {
  return options.every((opt) => LEAF_UNION_TYPES.has(opt._zod.def.type));
}

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

  const { type } = schema._zod.def;
  switch (type) {
    case 'object': {
      if (data === null || data === undefined || typeof data !== 'object')
        break;
      const typed = schema as ZodObject;
      const obj = data as Record<string, unknown>;
      let changed = false;
      const entries: [string, unknown][] = [];

      for (const [key, fieldSchema] of Object.entries(typed._zod.def.shape)) {
        const original = obj[key];
        const transformed = transformNode(
          fieldSchema as z.ZodType,
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
      const typed = schema as ZodArray;
      let changed = false;
      const items: unknown[] = [];

      for (const [i, datum] of data.entries()) {
        const transformed = transformNode(
          typed._zod.def.element as z.ZodType,
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
    case 'optional': {
      if (data === undefined || data === null) break;
      childResult = transformNode(
        (schema as ZodOptional)._zod.def.innerType as z.ZodType,
        data,
        path,
        transform,
      );
      break;
    }
    case 'nullable': {
      if (data === undefined || data === null) break;
      childResult = transformNode(
        (schema as ZodNullable)._zod.def.innerType as z.ZodType,
        data,
        path,
        transform,
      );
      break;
    }
    case 'nonoptional': {
      if (data === undefined || data === null) break;
      childResult = transformNode(
        (schema as ZodNonOptional)._zod.def.innerType as z.ZodType,
        data,
        path,
        transform,
      );
      break;
    }
    case 'readonly': {
      if (data === undefined || data === null) break;
      childResult = transformNode(
        (schema as ZodReadonly)._zod.def.innerType as z.ZodType,
        data,
        path,
        transform,
      );
      break;
    }
    case 'default': {
      childResult = transformNode(
        (schema as ZodDefault)._zod.def.innerType as z.ZodType,
        data,
        path,
        transform,
      );
      break;
    }
    case 'prefault': {
      childResult = transformNode(
        (schema as ZodPrefault)._zod.def.innerType as z.ZodType,
        data,
        path,
        transform,
      );
      break;
    }
    case 'union': {
      const typed = schema as ZodDiscriminatedUnion;
      const { discriminator, options } = typed._zod.def;
      if (discriminator) {
        const matchingOption = findDiscriminatedUnionMatch(
          options as z.ZodType[],
          discriminator,
          data,
        );
        if (matchingOption) {
          childResult = transformNode(matchingOption, data, path, transform);
        }
      } else if (isLeafUnion(options as z.ZodType[])) {
        // Leaf union — no structural descent needed.
        break;
      } else {
        throw new Error(
          `Plain z.union() is not supported unless all options are string/enum/literal (path: ${path.join('.')})`,
        );
      }
      break;
    }
    case 'tuple': {
      if (!Array.isArray(data)) break;
      const typed = schema as ZodTuple;
      const { items, rest } = typed._zod.def;
      let changed = false;
      const resultItems: unknown[] = [];

      for (const [i, itemSchema] of (items as z.ZodType[]).entries()) {
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
      if (rest) {
        for (let i = items.length; i < data.length; i++) {
          const transformed = transformNode(
            rest as z.ZodType,
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
      const typed = schema as ZodRecord;
      const { valueType } = typed._zod.def;
      const obj = data as Record<string, unknown>;
      let changed = false;
      const entries: [string, unknown][] = [];

      for (const [key, value] of Object.entries(obj)) {
        const transformed = transformNode(
          valueType as z.ZodType,
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
    case 'intersection': {
      // Transform left first, then transform the result via right
      const typed = schema as ZodIntersection;
      const leftResult = transformNode(
        typed._zod.def.left as z.ZodType,
        data,
        path,
        transform,
      );
      childResult = transformNode(
        typed._zod.def.right as z.ZodType,
        leftResult,
        path,
        transform,
      );
      break;
    }
    // Opaque / non-structural types are not supported in definition schemas.
    case 'transform':
    case 'pipe':
    case 'custom':
    case 'file':
    case 'symbol':
    case 'promise':
    case 'function':
    case 'bigint':
    case 'void':
    case 'nan':
    case 'lazy':
    case 'catch':
    case 'map':
    case 'set':
    case 'success':
    case 'template_literal': {
      throw new Error(
        `Schema type "${type}" is not supported in definition schemas (path: ${path.join('.')})`,
      );
    }
    // Serializable leaf types — no structural descent needed.
    case 'string':
    case 'number':
    case 'int':
    case 'boolean':
    case 'null':
    case 'undefined':
    case 'never':
    case 'any':
    case 'unknown':
    case 'date':
    case 'enum':
    case 'literal': {
      break;
    }
    default: {
      // Exhaustive guard: if Zod adds a new type, this will fail to compile.
      const _exhaustiveCheck: never = type;
      void _exhaustiveCheck;
      break;
    }
  }

  // Step 2: Apply transform to the (already-transformed) child result.
  return transform(childResult, { path, schema });
}
