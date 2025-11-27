import type { def } from '#src/schema/creator/index.js';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { adminCrudActionSpec } from './admin-action-spec.js';
import {
  adminCrudActionEntityType,
  baseAdminCrudActionSchema,
} from './types.js';

export const createAdminCrudActionSchema = definitionSchema((ctx) =>
  ctx
    .withEnt(baseAdminCrudActionSchema, {
      type: adminCrudActionEntityType,
      parentPath: {
        context: 'admin-section',
      },
      getNameResolver: (value) => value.type,
    })
    .transform((data) => {
      const { type } = data;
      const crudAction = ctx.plugins
        .getPluginSpec(adminCrudActionSpec)
        .getAdminCrudAction(type);
      return crudAction
        .createSchema(ctx)
        .and(baseAdminCrudActionSchema)
        .parse(data);
    }),
);

export type AdminCrudActionConfig = def.InferOutput<
  typeof createAdminCrudActionSchema
>;

export type AdminCrudActionConfigInput = def.InferInput<
  typeof createAdminCrudActionSchema
>;
