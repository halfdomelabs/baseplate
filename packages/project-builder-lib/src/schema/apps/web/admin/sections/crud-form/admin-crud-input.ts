import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { adminCrudInputSpec } from './admin-input-spec.js';
import { baseAdminCrudInputSchema } from './types.js';

export const createAdminCrudInputSchema = definitionSchema((ctx) => {
  const adminCrudInputs = ctx.plugins
    .getPluginSpec(adminCrudInputSpec)
    .getAdminCrudInputs();

  return baseAdminCrudInputSchema.transform((data) => {
    const inputDef = adminCrudInputs.get(data.type);
    if (!inputDef) return data;
    return inputDef.createSchema(ctx).parse(data);
  });
});
