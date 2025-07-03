import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { adminCrudInputSpec } from './admin-input-spec.js';
import { baseAdminCrudInputSchema } from './types.js';

export const createAdminCrudInputSchema = definitionSchema((ctx) =>
  baseAdminCrudInputSchema.passthrough().transform((data) => {
    const { type } = data;
    const crudInput = ctx.plugins
      .getPluginSpec(adminCrudInputSpec)
      .getAdminCrudInput(type);
    return {
      ...data,
      ...(crudInput.createSchema(ctx).parse(data) as Record<string, unknown>),
    };
  }),
);
