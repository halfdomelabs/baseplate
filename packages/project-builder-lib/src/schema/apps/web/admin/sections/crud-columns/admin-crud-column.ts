import z from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchemaWithSlots } from '#src/schema/creator/schema-creator.js';
import { modelEntityType } from '#src/schema/models/index.js';

import type { baseAdminCrudColumnSchema } from './types.js';

import { adminCrudColumnSpec } from './admin-column-spec.js';

export const createAdminCrudColumnSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType },
  (ctx, slots) => {
    const { columns } = ctx.plugins.use(adminCrudColumnSpec);
    return z.discriminatedUnion(
      'type',
      [...columns.values()].map((column) =>
        column.createSchema(ctx, slots),
      ) as [typeof baseAdminCrudColumnSchema],
    );
  },
);

export type AdminCrudColumnConfig = def.InferOutput<
  typeof createAdminCrudColumnSchema
>;

export type AdminCrudColumnConfigInput = def.InferInput<
  typeof createAdminCrudColumnSchema
>;
