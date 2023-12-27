import _ from 'lodash';
import { TypeOf, z } from 'zod';

import { ZodRefWrapper } from './ref-builder.js';
import { DefinitionReference, ReferencePath } from './types.js';

interface FixRefDeletionSuccessResult<TSchema extends z.ZodType> {
  type: 'success';
  value: TypeOf<TSchema>;
}

export interface FixRefDeletionError {
  ref: DefinitionReference;
  entityId: string;
}

interface FixRefDeletionFailureResult {
  type: 'failure';
  issues: FixRefDeletionError[];
}

export type FixRefDeletionResult<TSchema extends z.ZodType> =
  | FixRefDeletionSuccessResult<TSchema>
  | FixRefDeletionFailureResult;

// sentinel ID to signify the reference has been flagged for deletion
const DELETED_SENTINEL_ID = 'deleted-sentinel-id';

/**
 * Fixes any reference deletions by performing the appropriate action for the reference
 */
export function fixRefDeletions<TSchema extends z.ZodType>(
  schema: TSchema,
  value: TypeOf<TSchema>,
): FixRefDeletionResult<TSchema> {
  const processValue = _.cloneDeep(value);
  const issues: FixRefDeletionError[] = [];
  // find all references that do not have a corresponding entity
  let iterations;
  for (iterations = 0; iterations < 100; iterations++) {
    const { references, entities } =
      ZodRefWrapper.create(schema).parse(processValue);
    const entitiesById = _.keyBy(entities, (e) => e.id);
    const referencesMissingEntity = references.filter((r) => {
      const id = _.get(processValue, r.path) as string;
      return id !== DELETED_SENTINEL_ID && !entitiesById[id];
    });
    if (referencesMissingEntity.length === 0) {
      break;
    }

    const objectsToDeleteInArray: {
      path: ReferencePath;
      idx: number;
    }[] = [];

    // attempt to fix reference
    referencesMissingEntity.forEach((ref) => {
      const id = _.get(processValue, ref.path) as string;

      function tryDeleteParent(path: ReferencePath): boolean {
        if (path.length === 0) {
          return false;
        }
        const parentPath = path.slice(0, -1);
        const parent = _.get(processValue, parentPath) as unknown;
        if (!Array.isArray(parent)) {
          return false;
        }
        objectsToDeleteInArray.push({
          path: parentPath,
          idx: path[path.length - 1] as number,
        });
        return true;
      }

      switch (ref.onDelete) {
        case 'SET_NULL':
          _.set(processValue, ref.path, null);
          break;
        case 'RESTRICT':
          issues.push({ ref, entityId: id });
          _.set(processValue, ref.path, DELETED_SENTINEL_ID);
          break;
        case 'DELETE':
          if (!tryDeleteParent(ref.path)) {
            throw new Error(`Unable to find ref to cascade delete to`);
          }
          break;
        case 'DELETE_PARENT':
          if (!tryDeleteParent(ref.path.slice(0, -1))) {
            throw new Error(`Unable to find ref to cascade delete to`);
          }
          break;
        default:
          throw new Error(`Unknown onDelete action ${ref.onDelete as string}`);
      }
    });

    const objectsToDeleteByPath = _.groupBy(objectsToDeleteInArray, (o) =>
      o.path.join('.'),
    );

    // delete objects in reverse order to avoid index shifting
    Object.entries(objectsToDeleteByPath).forEach(([, objects]) => {
      const sortedObjects = _.sortBy(objects, (o) => -o.idx);
      sortedObjects.forEach((o) => {
        const parent = _.get(processValue, o.path) as unknown;
        if (!Array.isArray(parent)) {
          throw new Error(
            `Expected parent to be an array at path ${o.path.join('.')}`,
          );
        }
        parent.splice(o.idx, 1);
      });
    });
  }
  if (iterations === 100) {
    throw new Error(`Exceeded max iterations fixing deletions`);
  }

  if (issues.length) {
    return {
      type: 'failure',
      issues,
    };
  } else {
    return {
      type: 'success',
      value: processValue,
    };
  }
}
