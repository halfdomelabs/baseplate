import { zWithPlugins } from '@src/plugins/index.js';

import { adminCrudInputSpec } from './admin-input-spec.js';
import { baseAdminCrudInputSchema } from './types.js';

export const adminCrudInputSchema = zWithPlugins<
  typeof baseAdminCrudInputSchema
>((plugins, data) => {
  const { type } = baseAdminCrudInputSchema.parse(data);

  const input = plugins
    .getPluginSpec(adminCrudInputSpec)
    .getAdminCrudInput(type);

  return input.schema as typeof baseAdminCrudInputSchema;
});
