import z from 'zod';

import { definitionSchemaWithSlots } from '#src/schema/creator/schema-creator.js';

import type { baseTransformerSchema } from './types.js';

import { modelEntityType } from '../types.js';
import { modelTransformerSpec } from './model-transformer-spec.js';

export const createTransformerSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType },
  (ctx, slots) => {
    const transformers = ctx.plugins
      .getPluginSpec(modelTransformerSpec)
      .getModelTransformers();
    return z.discriminatedUnion(
      'type',
      Object.values(transformers).map((transformer) =>
        transformer.createSchema(ctx, slots),
      ) as [typeof baseTransformerSchema],
    );
  },
);
