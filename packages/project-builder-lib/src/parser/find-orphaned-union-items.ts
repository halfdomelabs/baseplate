import type { z, ZodDiscriminatedUnion } from 'zod';

import type { ReferencePath } from '#src/references/types.js';

import type { SchemaNodeVisitor } from './walk-data-with-schema.js';

import { findDiscriminatedUnionMatch } from './schema-structure.js';
import { walkDataWithSchema } from './walk-data-with-schema.js';

/**
 * Describes an item in a discriminated union array whose discriminator value
 * no longer matches any branch in the schema.
 *
 * This happens when a plugin that contributed a union branch is disabled —
 * the branch is removed from the schema but the data still contains items
 * with that discriminator value.
 */
export interface OrphanedUnionItem {
  /** Absolute path to the orphaned item in the data tree. */
  readonly path: ReferencePath;
  /** The discriminator field name (e.g., 'type'). */
  readonly discriminator: string;
  /** The discriminator value that has no matching schema branch (e.g., 'file'). */
  readonly discriminatorValue: string;
}

/**
 * Walks raw data against a Zod schema and collects items in discriminated
 * unions whose discriminator value no longer matches any schema branch.
 *
 * This is used to detect orphaned items before `schema.parse()` is called,
 * which would otherwise silently strip or reject the data.
 *
 * Uses `walkDataWithSchema` with a visitor that checks each discriminated
 * union node for unmatched discriminator values.
 */
export function findOrphanedUnionItems(
  schema: z.ZodType,
  data: unknown,
): OrphanedUnionItem[] {
  const items: OrphanedUnionItem[] = [];
  const visitor: SchemaNodeVisitor = {
    visit(nodeSchema, nodeData, ctx) {
      // Only interested in discriminated unions
      if (nodeSchema._zod.def.type !== 'union') return undefined;
      const { discriminator } = (nodeSchema as ZodDiscriminatedUnion)._zod.def;
      if (!discriminator) return undefined;

      // Check if the data has a discriminator value that doesn't match any branch
      if (
        nodeData === null ||
        nodeData === undefined ||
        typeof nodeData !== 'object'
      )
        return undefined;

      const discValue = (nodeData as Record<string, unknown>)[discriminator];
      if (typeof discValue !== 'string' || discValue === '') return undefined;

      const options = (nodeSchema as ZodDiscriminatedUnion)
        .options as z.ZodType[];
      const match = findDiscriminatedUnionMatch(
        options,
        discriminator,
        nodeData,
      );
      if (!match) {
        items.push({
          path: ctx.path,
          discriminator,
          discriminatorValue: discValue,
        });
      }

      return undefined;
    },
  };

  walkDataWithSchema(schema, data, [visitor]);
  return items;
}
