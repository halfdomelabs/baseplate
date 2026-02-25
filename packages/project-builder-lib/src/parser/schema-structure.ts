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

// ---------------------------------------------------------------------------
// SchemaChildren — discriminated union describing a schema node's children
// ---------------------------------------------------------------------------

export type SchemaChildren =
  | { readonly kind: 'leaf' }
  | { readonly kind: 'leaf-union' }
  | {
      readonly kind: 'wrapper';
      readonly innerSchema: z.ZodType;
      readonly skipIfNullish: boolean;
    }
  | {
      readonly kind: 'object';
      readonly entries: readonly (readonly [string, z.ZodType])[];
    }
  | { readonly kind: 'array'; readonly elementSchema: z.ZodType }
  | {
      readonly kind: 'tuple';
      readonly items: readonly z.ZodType[];
      readonly rest: z.ZodType | null;
    }
  | { readonly kind: 'record'; readonly valueSchema: z.ZodType }
  | {
      readonly kind: 'intersection';
      readonly left: z.ZodType;
      readonly right: z.ZodType;
    }
  | {
      readonly kind: 'discriminated-union';
      readonly match: z.ZodType | undefined;
    };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
 * Given a list of discriminated union options, finds the branch whose
 * discriminator literal includes the value found at `data[discriminator]`.
 *
 * Returns `undefined` if:
 * - `data` is not a plain object or doesn't contain the discriminator key
 * - no option matches the discriminator value in the data
 *
 * Throws if any option is not a ZodObject or its discriminator field is not a literal schema.
 */
export function findDiscriminatedUnionMatch(
  options: z.ZodType[],
  discriminator: string,
  data: unknown,
): z.ZodType | undefined {
  if (
    data === null ||
    data === undefined ||
    typeof data !== 'object' ||
    !(discriminator in data)
  ) {
    return undefined;
  }
  const discValue = (data as Record<string, unknown>)[discriminator];

  for (const option of options) {
    if (option._zod.def.type !== 'object') {
      throw new Error(
        `findDiscriminatedUnionMatch: discriminated union option must be an object schema (got type: "${option._zod.def.type}")`,
      );
    }
    const { shape } = (option as ZodObject)._zod.def;
    const discField = shape[discriminator] as z.ZodType | undefined;
    if (discField?._zod.def.type !== 'literal') {
      throw new Error(
        `findDiscriminatedUnionMatch: discriminator field "${discriminator}" must be a literal schema on each union option`,
      );
    }
    const { values } = discField._zod.def as unknown as { values: unknown[] };
    if (values.includes(discValue)) {
      return option;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// getSchemaChildren — single exhaustive type switch
// ---------------------------------------------------------------------------

/**
 * Classifies a Zod schema node and returns a descriptor of its child schemas.
 *
 * This is the single source of truth for schema structure traversal.
 * Both `walkDataWithSchema` and `transformDataWithSchema` delegate here
 * instead of duplicating the exhaustive type switch.
 *
 * Throws for unsupported schema types (transform, pipe, custom, etc.).
 */
export function getSchemaChildren(
  schema: z.ZodType,
  data: unknown,
  path: ReferencePath,
): SchemaChildren {
  const { type } = schema._zod.def;
  switch (type) {
    case 'object': {
      const typed = schema as ZodObject;
      return {
        kind: 'object',
        entries: Object.entries(typed._zod.def.shape) as [string, z.ZodType][],
      };
    }
    case 'array': {
      const typed = schema as ZodArray;
      return {
        kind: 'array',
        elementSchema: typed._zod.def.element as z.ZodType,
      };
    }
    case 'optional':
    case 'nullable':
    case 'nonoptional':
    case 'readonly': {
      // All four wrapper types share the same innerType structure and
      // should skip descent when data is nullish.
      const innerSchema = (
        schema as ZodOptional | ZodNullable | ZodNonOptional | ZodReadonly
      )._zod.def.innerType as z.ZodType;
      return { kind: 'wrapper', innerSchema, skipIfNullish: true };
    }
    case 'default':
    case 'prefault': {
      // Default/prefault wrappers always descend regardless of data value.
      const innerSchema = (schema as ZodDefault | ZodPrefault)._zod.def
        .innerType as z.ZodType;
      return { kind: 'wrapper', innerSchema, skipIfNullish: false };
    }
    case 'union': {
      const typed = schema as ZodDiscriminatedUnion;
      const { discriminator, options } = typed._zod.def;
      if (discriminator) {
        const match = findDiscriminatedUnionMatch(
          options as z.ZodType[],
          discriminator,
          data,
        );
        return { kind: 'discriminated-union', match };
      }
      if (isLeafUnion(options as z.ZodType[])) {
        return { kind: 'leaf-union' };
      }
      throw new Error(
        `Plain z.union() is not supported unless all options are string/enum/literal (path: ${path.join('.')})`,
      );
    }
    case 'tuple': {
      const typed = schema as ZodTuple;
      return {
        kind: 'tuple',
        items: typed._zod.def.items as z.ZodType[],
        rest: (typed._zod.def.rest as z.ZodType | null) ?? null,
      };
    }
    case 'record': {
      const typed = schema as ZodRecord;
      return {
        kind: 'record',
        valueSchema: typed._zod.def.valueType as z.ZodType,
      };
    }
    case 'intersection': {
      const typed = schema as ZodIntersection;
      return {
        kind: 'intersection',
        left: typed._zod.def.left as z.ZodType,
        right: typed._zod.def.right as z.ZodType,
      };
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
      return { kind: 'leaf' };
    }
    default: {
      // Exhaustive guard: if Zod adds a new type, this will fail to compile.
      const _exhaustiveCheck: never = type;
      void _exhaustiveCheck;
      return { kind: 'leaf' };
    }
  }
}
