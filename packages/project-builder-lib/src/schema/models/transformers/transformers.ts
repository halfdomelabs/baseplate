import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import type { TransformerConfig } from './types.js';

import { modelTransformerSpec } from './model-transformer-spec.js';
import { baseTransformerSchema } from './types.js';

export const createTransformerSchema = definitionSchema((ctx) =>
  baseTransformerSchema.passthrough().transform((data, parseCtx) => {
    const { type } = data;

    const transformer = ctx.plugins
      .getPluginSpec(modelTransformerSpec)
      .getModelTransformer(type);
    return transformer
      .createSchema(ctx)
      .and(baseTransformerSchema)
      .parse(data, {
        path: parseCtx.path,
      }) as TransformerConfig;
  }),
);
