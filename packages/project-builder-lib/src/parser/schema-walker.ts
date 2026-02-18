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
} from 'zod';

import type { ReferencePath } from '#src/references/types.js';

/**
 * The context passed to visitors during a schema walk.
 * Carries only the current path — visitors manage all other state externally.
 */
export interface SchemaWalkContext {
  /** The absolute path to the current node in the data. */
  readonly path: ReferencePath;
}

/**
 * A visitor that plugs into `walkSchemaWithData`.
 *
 * Called for every node in the schema tree. The visitor receives the schema
 * instance and can call its own registry internally. If the visitor returns a
 * cleanup function, it will be called after all children have been visited —
 * similar to the React `useEffect` cleanup pattern.
 */
export interface SchemaNodeVisitor {
  visit(
    schema: z.ZodType,
    data: unknown,
    ctx: SchemaWalkContext,
  ): (() => void) | undefined;
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

/**
 * Walks a Zod schema structure in parallel with parsed data, invoking
 * registered visitors whenever schema nodes are encountered.
 *
 * Each visitor's `visit()` is called for every node. If it returns a cleanup
 * function, that function is called after all children have been visited —
 * similar to the React `useEffect` cleanup pattern.
 *
 * Only serializable, structurally-traversable schema types are supported.
 * Non-serializable types (transform, custom, file, symbol, promise, function,
 * lazy, etc.) will throw at walk time.
 *
 * Only discriminated unions are supported — plain `z.union()` throws.
 */
export function walkSchemaWithData(
  schema: z.ZodType,
  data: unknown,
  visitors: readonly SchemaNodeVisitor[],
): void {
  walkNode(schema, data, [], visitors);
}

function walkNode(
  schema: z.ZodType,
  data: unknown,
  path: ReferencePath,
  visitors: readonly SchemaNodeVisitor[],
): void {
  const ctx: SchemaWalkContext = { path };

  // Step 1: Call all visitors, collect any cleanup functions returned.
  const cleanups: (() => void)[] = [];
  for (const visitor of visitors) {
    const cleanup = visitor.visit(schema, data, ctx);
    if (cleanup) cleanups.push(cleanup);
  }

  // Step 2: Structural descent based on schema type.
  // Switch on the string literal `type` discriminant — more reliable than
  // `instanceof` (e.g. `z.email()` has type "string" but is not a ZodString instance).
  // After matching, cast to the appropriate typed interface for typed `_zod.def` access.
  const { type } = schema._zod.def;
  switch (type) {
    case 'object': {
      if (data === null || data === undefined || typeof data !== 'object')
        break;
      const typed = schema as ZodObject;
      for (const [key, fieldSchema] of Object.entries(typed._zod.def.shape)) {
        walkNode(
          fieldSchema as z.ZodType,
          (data as Record<string, unknown>)[key],
          [...path, key],
          visitors,
        );
      }
      break;
    }
    case 'array': {
      if (!Array.isArray(data)) break;
      const typed = schema as ZodArray;
      for (const [i, datum] of data.entries()) {
        walkNode(
          typed._zod.def.element as z.ZodType,
          datum,
          [...path, i],
          visitors,
        );
      }
      break;
    }
    case 'optional': {
      if (data === undefined || data === null) break;
      walkNode(
        (schema as ZodOptional)._zod.def.innerType as z.ZodType,
        data,
        path,
        visitors,
      );
      break;
    }
    case 'nullable': {
      if (data === undefined || data === null) break;
      walkNode(
        (schema as ZodNullable)._zod.def.innerType as z.ZodType,
        data,
        path,
        visitors,
      );
      break;
    }
    case 'nonoptional': {
      if (data === undefined || data === null) break;
      walkNode(
        (schema as ZodNonOptional)._zod.def.innerType as z.ZodType,
        data,
        path,
        visitors,
      );
      break;
    }
    case 'readonly': {
      if (data === undefined || data === null) break;
      walkNode(
        (schema as ZodReadonly)._zod.def.innerType as z.ZodType,
        data,
        path,
        visitors,
      );
      break;
    }
    case 'default': {
      // Provides a default for missing values; still walk with whatever data we have
      walkNode(
        (schema as ZodDefault)._zod.def.innerType as z.ZodType,
        data,
        path,
        visitors,
      );
      break;
    }
    case 'prefault': {
      walkNode(
        (schema as ZodPrefault)._zod.def.innerType as z.ZodType,
        data,
        path,
        visitors,
      );
      break;
    }
    case 'union': {
      // Only discriminated unions are supported — plain unions can't be walked
      // safely since we'd visit collectors on branches that don't match the data.
      const typed = schema as ZodDiscriminatedUnion;
      const { discriminator, options } = typed._zod.def;
      if (!discriminator) {
        throw new Error(
          `Plain z.union() is not supported in definition schemas — use z.discriminatedUnion() (path: ${JSON.stringify(path)})`,
        );
      }
      const matchingOption = findDiscriminatedUnionMatch(
        options as z.ZodType[],
        discriminator,
        data,
      );
      if (matchingOption) {
        walkNode(matchingOption, data, path, visitors);
      }
      break;
    }
    case 'intersection': {
      // Walk both sides — data satisfies both schemas simultaneously
      const typed = schema as ZodIntersection;
      walkNode(typed._zod.def.left as z.ZodType, data, path, visitors);
      walkNode(typed._zod.def.right as z.ZodType, data, path, visitors);
      break;
    }
    // Non-serializable / opaque types not supported in definition schemas
    case 'transform':
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
    case 'pipe':
    case 'success':
    case 'template_literal': {
      throw new Error(
        `Schema type "${type}" is not supported in definition schemas (path: ${JSON.stringify(path)})`,
      );
    }
    // Serializable leaf types — no structural descent needed.
    // Explicitly listed so that if Zod adds a new type that we haven't
    // classified, the assignment below will fail to compile.
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
    case 'record':
    case 'tuple':
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

  // Step 3: Run cleanup functions in reverse order (innermost first).
  for (let i = cleanups.length - 1; i >= 0; i--) {
    cleanups[i]();
  }
}
