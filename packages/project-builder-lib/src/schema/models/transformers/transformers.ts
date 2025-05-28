import { zWithPlugins } from '#src/plugins/index.js';

import { modelTransformerSpec } from './model-transformer-spec.js';
import { baseTransformerSchema } from './types.js';

export const transformerSchema = zWithPlugins<typeof baseTransformerSchema>(
  (plugins, data) => {
    const { type } = baseTransformerSchema.parse(data);

    const transformer = plugins
      .getPluginSpec(modelTransformerSpec)
      .getModelTransformer(type);

    return transformer.schema as typeof baseTransformerSchema;
  },
);
