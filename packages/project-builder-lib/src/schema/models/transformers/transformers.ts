import { zWithPlugins } from '#src/plugins/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { modelTransformerSpec } from './model-transformer-spec.js';
import { baseTransformerSchema } from './types.js';

export const createTransformerSchema = definitionSchema((ctx) =>
  zWithPlugins<typeof baseTransformerSchema>((plugins, data) => {
    const { type } = baseTransformerSchema.parse(data);

    const transformer = plugins
      .getPluginSpec(modelTransformerSpec)
      .getModelTransformer(type);

    return transformer.schema(ctx) as typeof baseTransformerSchema;
  }),
);
