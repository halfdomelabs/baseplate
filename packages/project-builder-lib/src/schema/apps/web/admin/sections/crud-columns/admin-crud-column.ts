import type { def } from '#src/schema/creator/index.js';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import type { AdminCrudColumnDefinition } from './types.js';

import { adminCrudColumnSpec } from './admin-column-spec.js';
import {
  adminCrudColumnEntityType,
  baseAdminCrudColumnSchema,
} from './types.js';

export const createAdminCrudColumnSchema = definitionSchema((ctx) =>
  ctx
    .withEnt(baseAdminCrudColumnSchema.passthrough(), {
      type: adminCrudColumnEntityType,
      parentPath: {
        context: 'admin-section',
      },
      getNameResolver: (value) => value.type,
    })
    .transform((data, parseCtx) => {
      const { type } = data;
      const crudColumn = ctx.plugins
        .getPluginSpec(adminCrudColumnSpec)
        .getAdminCrudColumn(type);
      return crudColumn
        .createSchema(ctx)
        .and(baseAdminCrudColumnSchema)
        .parse(data, {
          path: parseCtx.path,
        }) as AdminCrudColumnDefinition;
    }),
);

export type AdminCrudColumnConfig = def.InferOutput<
  typeof createAdminCrudColumnSchema
>;

export type AdminCrudColumnConfigInput = def.InferInput<
  typeof createAdminCrudColumnSchema
>;
