import type { z } from 'zod';

import type { ReferencePath } from '#src/references/types.js';

import { getSchemaChildren } from './schema-structure.js';

/**
 * The context passed to visitors during a schema walk.
 * Carries only the current path — visitors manage all other state externally.
 */
export interface SchemaWalkContext {
  /** The absolute path to the current node in the data. */
  readonly path: ReferencePath;
}

/**
 * A visitor that plugs into `walkDataWithSchema`.
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
 * Discriminated unions are fully supported. Plain `z.union()` is allowed only
 * when every option is a leaf type (string, enum, or literal); otherwise it throws.
 */
export function walkDataWithSchema(
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

  // Step 2: Structural descent based on schema children.
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
      walkNode(children.innerSchema, data, path, visitors);
      break;
    }
    case 'object': {
      if (data === null || data === undefined || typeof data !== 'object')
        break;
      for (const [key, fieldSchema] of children.entries) {
        walkNode(
          fieldSchema,
          (data as Record<string, unknown>)[key],
          [...path, key],
          visitors,
        );
      }
      break;
    }
    case 'array': {
      if (!Array.isArray(data)) break;
      for (const [i, datum] of data.entries()) {
        walkNode(children.elementSchema, datum, [...path, i], visitors);
      }
      break;
    }
    case 'tuple': {
      if (!Array.isArray(data)) break;
      for (const [i, itemSchema] of children.items.entries()) {
        if (i < data.length) {
          walkNode(itemSchema, data[i], [...path, i], visitors);
        }
      }
      if (children.rest) {
        for (let i = children.items.length; i < data.length; i++) {
          walkNode(children.rest, data[i], [...path, i], visitors);
        }
      }
      break;
    }
    case 'record': {
      if (data === null || data === undefined || typeof data !== 'object')
        break;
      for (const [key, value] of Object.entries(
        data as Record<string, unknown>,
      )) {
        walkNode(children.valueSchema, value, [...path, key], visitors);
      }
      break;
    }
    case 'discriminated-union': {
      if (children.match) {
        walkNode(children.match, data, path, visitors);
      }
      break;
    }
    case 'intersection': {
      // Walk both sides — data satisfies both schemas simultaneously
      walkNode(children.left, data, path, visitors);
      walkNode(children.right, data, path, visitors);
      break;
    }
  }

  // Step 3: Run cleanup functions in reverse order (innermost first).
  for (let i = cleanups.length - 1; i >= 0; i--) {
    cleanups[i]();
  }
}
