import type { def } from '#src/schema/creator/index.js';

import { definitionSchemaWithSlots } from '#src/schema/creator/schema-creator.js';
import { modelEntityType } from '#src/schema/models/index.js';

import { adminCrudColumnSpec } from './admin-column-spec.js';
import { baseAdminCrudColumnSchema } from './types.js';

export const createAdminCrudColumnSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType },
  (ctx, slots) => {
    const adminCrudColumns = ctx.plugins.use(adminCrudColumnSpec).columns;

    return baseAdminCrudColumnSchema.transform((data) => {
      const columnDef = adminCrudColumns.get(data.type);
      if (!columnDef) return data;
      return columnDef.createSchema(ctx, slots).parse(data);
    });
  },
);

export type AdminCrudColumnConfig = def.InferOutput<
  typeof createAdminCrudColumnSchema
>;

export type AdminCrudColumnConfigInput = def.InferInput<
  typeof createAdminCrudColumnSchema
>;
