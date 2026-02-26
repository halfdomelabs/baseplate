import type { z } from 'zod';

import { sortBy } from 'es-toolkit';
import { get, groupBy, set } from 'es-toolkit/compat';

import type {
  DefinitionReference,
  ReferencePath,
  ResolvedZodRefPayload,
} from './types.js';

import { parseSchemaWithTransformedReferences } from './parse-schema-with-references.js';

interface FixRefDeletionSuccessResult<T> {
  type: 'success';
  value: T;
  refPayload: ResolvedZodRefPayload<T>;
}

export interface FixRefDeletionError {
  ref: DefinitionReference;
  entityId: string;
}

interface FixRefDeletionFailureResult {
  type: 'failure';
  issues: FixRefDeletionError[];
}

export type FixRefDeletionResult<T> =
  | FixRefDeletionSuccessResult<T>
  | FixRefDeletionFailureResult;

// sentinel ID to signify the reference has been flagged for deletion
const DELETED_SENTINEL_ID = 'deleted-sentinel-id';

/**
 * Fixes any reference deletions by performing the appropriate action for the reference
 */
export function fixRefDeletions<T extends z.ZodType>(
  schema: T,
  value: unknown,
): FixRefDeletionResult<z.output<T>> {
  const issues: FixRefDeletionError[] = [];

  // find all references that do not have a corresponding entity
  let iterations;
  let valueToEdit = value;
  for (iterations = 0; iterations < 100; iterations++) {
    const parseResult = parseSchemaWithTransformedReferences(
      schema,
      valueToEdit,
      {
        allowInvalidReferences: true,
      },
    );
    const { references, entities } = parseResult;
    valueToEdit = parseResult.data;
    const entitiesById = new Map(entities.map((e) => [e.id, e]));
    const referencesMissingEntity = references.filter((r) => {
      const id = get(valueToEdit as object, r.path) as string;
      return id !== DELETED_SENTINEL_ID && !entitiesById.has(id);
    });
    if (referencesMissingEntity.length === 0) {
      if (issues.length > 0) {
        return {
          type: 'failure',
          issues,
        };
      }
      return {
        type: 'success',
        value: valueToEdit as z.output<T>,
        refPayload: parseResult,
      };
    }

    const objectsToDeleteInArray: {
      path: ReferencePath;
      idx: number;
    }[] = [];

    function tryDeleteParent(path: ReferencePath): boolean {
      if (path.length === 0) {
        return false;
      }
      const parentPath = path.slice(0, -1);
      const parent = get(valueToEdit as object, parentPath) as unknown;
      if (!Array.isArray(parent)) {
        return false;
      }
      objectsToDeleteInArray.push({
        path: parentPath,
        idx: path.at(-1) as number,
      });
      return true;
    }

    // attempt to fix reference
    for (const ref of referencesMissingEntity) {
      const id = get(valueToEdit as object, ref.path) as string;

      switch (ref.onDelete) {
        case 'SET_UNDEFINED': {
          // Check if reference is inside an array
          if (ref.path.length > 0) {
            const parentPath = ref.path.slice(0, -1);
            const parent = get(valueToEdit as object, parentPath) as unknown;
            if (Array.isArray(parent)) {
              throw new TypeError(
                `SET_UNDEFINED cannot be used for references inside arrays at path ${ref.path.join('.')}. Use DELETE instead to remove the array element.`,
              );
            }
          }
          set(valueToEdit as object, ref.path, undefined);
          break;
        }
        case 'RESTRICT': {
          issues.push({ ref, entityId: id });
          set(valueToEdit as object, ref.path, DELETED_SENTINEL_ID);
          break;
        }
        case 'DELETE': {
          if (!tryDeleteParent(ref.path)) {
            throw new Error(`Unable to find ref to cascade delete to`);
          }
          break;
        }
        case 'DELETE_PARENT': {
          if (!tryDeleteParent(ref.path.slice(0, -1))) {
            throw new Error(`Unable to find ref to cascade delete to`);
          }
          break;
        }
        default: {
          throw new Error(`Unknown onDelete action ${ref.onDelete as string}`);
        }
      }
    }

    const objectsToDeleteByPath = groupBy(objectsToDeleteInArray, (o) =>
      o.path.join('.'),
    );

    // delete objects in reverse order to avoid index shifting
    for (const [, objects] of Object.entries(objectsToDeleteByPath)) {
      const sortedObjects = sortBy(objects, [(o) => -o.idx]);
      for (const o of sortedObjects) {
        const parent = get(valueToEdit as object, o.path) as unknown;
        if (!Array.isArray(parent)) {
          throw new TypeError(
            `Expected parent to be an array at path ${o.path.join('.')}`,
          );
        }
        parent.splice(o.idx, 1);
      }
    }
  }
  throw new Error(`Exceeded max iterations fixing deletions`);
}
