import { adminCrudInputSpec } from './admin-input-spec.js';
import { baseAdminCrudInputSchema } from './types.js';
import { zWithPlugins } from '@src/plugins/index.js';

export const transformerSchema = zWithPlugins<typeof baseAdminCrudInputSchema>(
  (plugins, data) => {
    const { type } = baseAdminCrudInputSchema.parse(data);

    const input = plugins
      .getPluginSpec(adminCrudInputSpec)
      .getAdminCrudInput(type);

    return input.schema as typeof baseAdminCrudInputSchema;
  },
);
