import type { z, ZodDiscriminatedUnion } from 'zod';

import { getSchemaChildren } from './schema-structure.js';

// ---------------------------------------------------------------------------
// Path types
// ---------------------------------------------------------------------------

/**
 * Represents a single step in navigating through a schema structure.
 *
 * - `object-key`: navigate into an object property
 * - `tuple-index`: navigate into a specific tuple position
 * - `discriminated-union-array`: enter an array and pick the unique element
 *   matching a discriminator value
 * - `array`: descend into a plain array's element schema (non-deterministic)
 * - `record`: descend into a record's value schema (non-deterministic)
 */
export type SchemaPathElement =
  | { type: 'object-key'; key: string }
  | { type: 'tuple-index'; index: number }
  | {
      type: 'discriminated-union-array';
      discriminatorKey: string;
      value: string;
    }
  | { type: 'array' }
  | { type: 'record' };

// ---------------------------------------------------------------------------
// Visitor types
// ---------------------------------------------------------------------------

/**
 * The context passed to visitors during a schema structure walk.
 * Carries the current path as `SchemaPathElement[]`.
 */
export interface SchemaStructureWalkContext {
  /** The absolute path to the current node in the schema. */
  readonly path: SchemaPathElement[];
}

/**
 * A visitor that plugs into `walkSchemaStructure`.
 *
 * Called for every node in the schema tree. If the visitor returns a
 * cleanup function, it will be called after all children have been visited —
 * similar to the React `useEffect` cleanup pattern.
 */
export interface SchemaStructureVisitor {
  visit(
    schema: z.ZodType,
    ctx: SchemaStructureWalkContext,
  ): (() => void) | undefined;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Walks a Zod schema structure (without data) invoking registered visitors
 * at every schema node.
 *
 * Unlike `walkDataWithSchema`, this operates on the schema alone.
 * Every structural descent produces a path element:
 * - Object keys → `object-key`
 * - Tuple indices → `tuple-index`
 * - Arrays of discriminated unions → `discriminated-union-array` (one per branch)
 * - Plain arrays → `array`
 * - Records → `record`
 * - Discriminated unions on objects are transparent (no path element)
 *
 * Uses a `Set<z.ZodType>` circular-reference guard with delete-on-backtrack
 * so the same schema can appear at different paths.
 */
export function walkSchemaStructure(
  schema: z.ZodType,
  visitors: readonly SchemaStructureVisitor[],
): void {
  walkNode(schema, [], visitors, new Set());
}

// ---------------------------------------------------------------------------
// Internal walker
// ---------------------------------------------------------------------------

function walkNode(
  schema: z.ZodType,
  path: SchemaPathElement[],
  visitors: readonly SchemaStructureVisitor[],
  visited: Set<z.ZodType>,
): void {
  // Circular reference guard
  if (visited.has(schema)) {
    return;
  }
  visited.add(schema);

  const ctx: SchemaStructureWalkContext = { path };

  // Step 1: Call all visitors, collect any cleanup functions returned.
  const cleanups: (() => void)[] = [];
  for (const visitor of visitors) {
    const cleanup = visitor.visit(schema, ctx);
    if (cleanup) cleanups.push(cleanup);
  }

  // Step 2: Structural descent based on schema children (no data).
  const children = getSchemaChildren(schema, undefined, []);
  switch (children.kind) {
    case 'leaf':
    case 'leaf-union': {
      break;
    }

    case 'wrapper': {
      walkNode(children.innerSchema, path, visitors, visited);
      break;
    }

    case 'object': {
      for (const [key, fieldSchema] of children.entries) {
        walkNode(
          fieldSchema,
          [...path, { type: 'object-key', key }],
          visitors,
          visited,
        );
      }
      break;
    }

    case 'array': {
      // Check if the element schema is a discriminated union.
      // If so, walk each branch with a discriminated-union-array path element.
      // Otherwise, walk the element schema with no path element (non-deterministic).
      const unwrappedElement = unwrapSchema(children.elementSchema);
      const elementChildren = getSchemaChildren(
        unwrappedElement,
        undefined,
        [],
      );

      if (elementChildren.kind === 'discriminated-union') {
        walkDiscriminatedUnionArrayBranches(
          unwrappedElement as ZodDiscriminatedUnion,
          path,
          visitors,
          visited,
        );
      } else {
        // Plain array — descend with an array path element
        walkNode(
          children.elementSchema,
          [...path, { type: 'array' }],
          visitors,
          visited,
        );
      }
      break;
    }

    case 'discriminated-union': {
      // Transparent on objects — walk all branches with the same path.
      const unwrapped = unwrapSchema(schema) as ZodDiscriminatedUnion;
      for (const option of unwrapped.options as z.ZodType[]) {
        walkNode(option, path, visitors, visited);
      }
      break;
    }

    case 'tuple': {
      for (const [i, itemSchema] of children.items.entries()) {
        walkNode(
          itemSchema,
          [...path, { type: 'tuple-index', index: i }],
          visitors,
          visited,
        );
      }
      if (children.rest) {
        // Rest elements don't have a fixed index; walk without path element
        walkNode(children.rest, path, visitors, visited);
      }
      break;
    }

    case 'record': {
      // Record — descend with a record path element
      walkNode(
        children.valueSchema,
        [...path, { type: 'record' }],
        visitors,
        visited,
      );
      break;
    }

    case 'intersection': {
      walkNode(children.left, path, visitors, visited);
      walkNode(children.right, path, visitors, visited);
      break;
    }
  }

  // Step 3: Run cleanup functions in reverse order (innermost first).
  for (let i = cleanups.length - 1; i >= 0; i--) {
    cleanups[i]();
  }

  visited.delete(schema);
}

/**
 * Walks each branch of a discriminated union that is an array element,
 * pushing a `discriminated-union-array` path element for each branch.
 */
function walkDiscriminatedUnionArrayBranches(
  unionSchema: ZodDiscriminatedUnion,
  path: SchemaPathElement[],
  visitors: readonly SchemaStructureVisitor[],
  visited: Set<z.ZodType>,
): void {
  const discriminatorKey = unionSchema._zod.def.discriminator;
  for (const option of unionSchema.options as z.ZodType[]) {
    const literalValue = extractDiscriminatorValue(option, discriminatorKey);
    if (literalValue == null) {
      // Fallback: walk without path element
      walkNode(option, path, visitors, visited);
      continue;
    }

    walkNode(
      option,
      [
        ...path,
        {
          type: 'discriminated-union-array',
          discriminatorKey,
          value: literalValue,
        },
      ],
      visitors,
      visited,
    );
  }
}

/**
 * Extracts the literal discriminator value from a union branch schema.
 */
function extractDiscriminatorValue(
  branchSchema: z.ZodType,
  discriminatorKey: string,
): string | undefined {
  const branchChildren = getSchemaChildren(branchSchema, undefined, []);
  if (branchChildren.kind !== 'object') {
    return undefined;
  }

  const discEntry = branchChildren.entries.find(
    ([key]) => key === discriminatorKey,
  );
  if (!discEntry) {
    return undefined;
  }

  const discSchema = unwrapSchema(discEntry[1]);
  const discChildren = getSchemaChildren(discSchema, undefined, []);
  if (discChildren.kind !== 'leaf') {
    return undefined;
  }

  const { values } = discSchema._zod.def as unknown as {
    values: unknown[];
  };
  return values[0] as string | undefined;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Unwraps wrapper schemas (optional, nullable, default, etc.) to the underlying schema.
 */
function unwrapSchema(schema: z.ZodType): z.ZodType {
  const children = getSchemaChildren(schema, undefined, []);
  if (children.kind === 'wrapper') {
    return unwrapSchema(children.innerSchema);
  }
  return schema;
}
