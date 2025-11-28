import type { def } from '#src/schema/creator/index.js';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { adminCrudColumnSpec } from './admin-column-spec.js';
import { baseAdminCrudColumnSchema } from './types.js';

export const createAdminCrudColumnSchema = definitionSchema((ctx) => {
  const adminCrudColumns = ctx.plugins
    .getPluginSpec(adminCrudColumnSpec)
    .getAdminCrudColumns();

  return baseAdminCrudColumnSchema.transform((data) => {
    const columnDef = adminCrudColumns.get(data.type);
    if (!columnDef) return data;
    return columnDef.createSchema(ctx).parse(data);
  });
});

export type AdminCrudColumnConfig = def.InferOutput<
  typeof createAdminCrudColumnSchema
>;

export type AdminCrudColumnConfigInput = def.InferInput<
  typeof createAdminCrudColumnSchema
>;
