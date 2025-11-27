import z from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import type { baseAdminCrudColumnSchema } from './types.js';

import { adminCrudColumnSpec } from './admin-column-spec.js';

export const createAdminCrudColumnSchema = definitionSchema((ctx) => {
  const adminCrudColumns = ctx.plugins
    .getPluginSpec(adminCrudColumnSpec)
    .getAdminCrudColumns();
  const schemas = [...adminCrudColumns.values()].map((column) =>
    column.createSchema(ctx),
  );
  return z.discriminatedUnion(
    'type',
    schemas as [
      typeof baseAdminCrudColumnSchema,
      ...(typeof baseAdminCrudColumnSchema)[],
    ],
  );
});

export type AdminCrudColumnConfig = def.InferOutput<
  typeof createAdminCrudColumnSchema
>;

export type AdminCrudColumnConfigInput = def.InferInput<
  typeof createAdminCrudColumnSchema
>;
