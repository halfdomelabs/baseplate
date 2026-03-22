import type { z } from 'zod';

import { compareStrings } from '@baseplate-dev/utils';

import { getSchemaChildren } from '#src/parser/schema-structure.js';
import { transformDataWithSchema } from '#src/parser/transform-data-with-schema.js';

import { getEntityMeta, getEntityName } from './merge-schema/entity-utils.js';

type PlainObject = Record<string, unknown>;

/**
 * Sorts all entity arrays in a serialized definition by their resolved name.
 *
 * Uses `transformDataWithSchema` to walk the schema+data tree bottom-up.
 * Arrays whose element schema has entity metadata (via `withEnt`) are sorted
 * using `compareStrings` unless the entity has `disableSort: true`.
 * All other arrays are left in their original order.
 *
 * @param schema - The Zod schema describing the data structure
 * @param data - The serialized data (entity IDs already replaced with names)
 * @returns A new data tree with entity arrays sorted by name
 */
export function sortEntityArrays<T>(schema: z.ZodType, data: T): T {
  return transformDataWithSchema(
    schema,
    data,
    (value, { schema: nodeSchema }) => {
      if (!Array.isArray(value)) return value;

      const items = value as PlainObject[];

      const children = getSchemaChildren(nodeSchema, items, []);
      if (children.kind !== 'array') return items;

      const entityMeta = getEntityMeta(children.elementSchema);
      if (!entityMeta?.sortByName) return items;

      return items.toSorted((a, b) =>
        compareStrings(
          getEntityName(entityMeta, a),
          getEntityName(entityMeta, b),
        ),
      );
    },
  );
}
