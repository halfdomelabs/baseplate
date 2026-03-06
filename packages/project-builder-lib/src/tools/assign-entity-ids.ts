import type { z } from 'zod';

import { immutableSet } from '@baseplate-dev/utils';
import { get } from 'es-toolkit/compat';

import { transformDataWithSchema } from '#src/parser/transform-data-with-schema.js';

import { getEntityMeta } from './merge-schema/entity-utils.js';

interface AssignEntityIdsOptions {
  /** If returns true for an ID, that ID is preserved (not regenerated). */
  isExistingId?: (id: string) => boolean;
}

/**
 * Recursively assigns IDs to an entity and all nested child entities.
 *
 * Walks the schema using `transformDataWithSchema` to detect entity nodes
 * (via `getEntityMeta`). At each entity boundary, generates a new ID unless
 * the existing ID is preserved by the `isExistingId` callback.
 *
 * Returns a new object with IDs assigned (immutable, structural sharing).
 */
export function assignEntityIds<T>(
  schema: z.ZodType,
  data: T,
  options?: AssignEntityIdsOptions,
): T {
  return transformDataWithSchema(schema, data, (value, ctx) => {
    const entityMeta = getEntityMeta(ctx.schema);
    if (!entityMeta) {
      return value;
    }
    if (value === null || value === undefined || typeof value !== 'object') {
      return value;
    }

    const currentId = get(value, entityMeta.idPath) as unknown;
    if (currentId !== undefined && typeof currentId !== 'string') {
      throw new TypeError(
        `Expected string id at path "${entityMeta.idPath.join('.')}" but got ${typeof currentId}`,
      );
    }
    if (currentId && options?.isExistingId?.(currentId)) {
      return value;
    }

    const newId = entityMeta.type.generateNewId();
    return immutableSet(value, entityMeta.idPath, newId);
  });
}
