import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { adminCrudInputSpec } from './admin-input-spec.js';
import { adminCrudInputEntityType, baseAdminCrudInputSchema } from './types.js';

export const createAdminCrudInputSchema = definitionSchema((ctx) =>
  ctx
    .withEnt(baseAdminCrudInputSchema, {
      type: adminCrudInputEntityType,
      parentPath: {
        context: 'admin-section',
      },
      getNameResolver: (value) => value.id ?? '',
    })
    .transform((data) => {
      const { type } = data;
      const crudInput = ctx.plugins
        .getPluginSpec(adminCrudInputSpec)
        .getAdminCrudInput(type);
      return crudInput
        .createSchema(ctx)
        .and(baseAdminCrudInputSchema)
        .parse(data);
    }),
);
