import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import type { AdminCrudInputDefinition } from './types.js';

import { adminCrudInputSpec } from './admin-input-spec.js';
import { baseAdminCrudInputSchema } from './types.js';

export const createAdminCrudInputSchema = definitionSchema((ctx) =>
  baseAdminCrudInputSchema.passthrough().transform((data, parseCtx) => {
    const { type } = data;
    const crudInput = ctx.plugins
      .getPluginSpec(adminCrudInputSpec)
      .getAdminCrudInput(type);
    return crudInput
      .createSchema(ctx)
      .and(baseAdminCrudInputSchema)
      .parse(data, {
        path: parseCtx.path,
      }) as AdminCrudInputDefinition;
  }),
);
