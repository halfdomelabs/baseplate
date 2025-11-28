import z from 'zod';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import type { baseTransformerSchema } from './types.js';

import { modelTransformerSpec } from './model-transformer-spec.js';

export const createTransformerSchema = definitionSchema((ctx) => {
  const transformers = ctx.plugins
    .getPluginSpec(modelTransformerSpec)
    .getModelTransformers();
  return z.discriminatedUnion(
    'type',
    Object.values(transformers).map((transformer) =>
      transformer.createSchema(ctx),
    ) as [typeof baseTransformerSchema],
  );
});
