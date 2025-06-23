import { zWithPlugins } from '#src/plugins/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { adminCrudInputSpec } from './admin-input-spec.js';
import { baseAdminCrudInputSchema } from './types.js';

export const createAdminCrudInputSchema = definitionSchema((ctx) =>
  zWithPlugins<typeof baseAdminCrudInputSchema>((plugins, data) => {
    const { type } = baseAdminCrudInputSchema.parse(data);

    const input = plugins
      .getPluginSpec(adminCrudInputSpec)
      .getAdminCrudInput(type);

    return input.schema(ctx) as typeof baseAdminCrudInputSchema;
  }),
);
