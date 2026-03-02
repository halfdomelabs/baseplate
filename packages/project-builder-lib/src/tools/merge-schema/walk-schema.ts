import type { z, ZodDiscriminatedUnion } from 'zod';

import type { EntitySchemaMeta } from '#src/references/definition-ref-registry.js';

import { getSchemaChildren } from '#src/parser/schema-structure.js';

import { getEntityMeta } from './entity-utils.js';

/**
 * Information about an entity array found during schema walking.
 */
export interface EntityArrayInfo {
  /** Dot-separated path to the array in the definition (e.g., "models", "models.*.model.fields") */
  path: string;
  /** The entity metadata registered on the array element schema */
  entityMeta: EntitySchemaMeta;
  /** The Zod schema for the array element */
  elementSchema: z.ZodType;
}

/**
 * Unwraps wrapper schemas (optional, nullable, default, prefault, readonly)
 * to reach the underlying structural schema.
 */
function unwrapSchema(schema: z.ZodType): z.ZodType {
  const children = getSchemaChildren(schema, undefined, []);
  if (children.kind === 'wrapper') {
    return unwrapSchema(children.innerSchema);
  }
  return schema;
}

/**
 * Recursively walks a Zod schema (without data) and collects all entity arrays.
 *
 * Unlike `walkDataWithSchema`, this operates on the schema structure alone.
 * For discriminated unions, it walks all branches (since there's no data to
 * pick a specific branch). Entity arrays are detected via `definitionRefRegistry`
 * entity metadata on array element schemas.
 *
 * @param schema - The root Zod schema to walk
 * @returns All entity arrays found, with their paths and metadata
 */
export function collectEntityArrays(schema: z.ZodType): EntityArrayInfo[] {
  const result: EntityArrayInfo[] = [];
  walkSchemaNode(schema, [], result, new Set());
  return result;
}

function walkSchemaNode(
  schema: z.ZodType,
  pathParts: string[],
  result: EntityArrayInfo[],
  visited: Set<z.ZodType>,
): void {
  // Guard against circular references
  if (visited.has(schema)) {
    return;
  }
  visited.add(schema);

  const children = getSchemaChildren(schema, undefined, []);

  switch (children.kind) {
    case 'leaf':
    case 'leaf-union': {
      break;
    }

    case 'wrapper': {
      walkSchemaNode(children.innerSchema, pathParts, result, visited);
      break;
    }

    case 'object': {
      for (const [key, fieldSchema] of children.entries) {
        walkSchemaNode(fieldSchema, [...pathParts, key], result, visited);
      }
      break;
    }

    case 'array': {
      const entityMeta = getEntityMeta(children.elementSchema);
      if (entityMeta) {
        result.push({
          path: pathParts.join('.'),
          entityMeta,
          elementSchema: children.elementSchema,
        });
      }
      // Continue walking inside array elements using `*` as path segment
      walkSchemaNode(
        children.elementSchema,
        [...pathParts, '*'],
        result,
        visited,
      );
      break;
    }

    case 'discriminated-union': {
      // Walk all branches since we don't have data to pick one
      const unwrapped = unwrapSchema(schema) as ZodDiscriminatedUnion;
      const { options } = unwrapped._zod.def;
      for (const option of options as z.ZodType[]) {
        walkSchemaNode(option, pathParts, result, visited);
      }
      break;
    }

    case 'tuple': {
      for (const [i, itemSchema] of children.items.entries()) {
        walkSchemaNode(itemSchema, [...pathParts, String(i)], result, visited);
      }
      if (children.rest) {
        walkSchemaNode(children.rest, [...pathParts, '*'], result, visited);
      }
      break;
    }

    case 'record': {
      walkSchemaNode(
        children.valueSchema,
        [...pathParts, '*'],
        result,
        visited,
      );
      break;
    }

    case 'intersection': {
      walkSchemaNode(children.left, pathParts, result, visited);
      walkSchemaNode(children.right, pathParts, result, visited);
      break;
    }
  }

  visited.delete(schema);
}
