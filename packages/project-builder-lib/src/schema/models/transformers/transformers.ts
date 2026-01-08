import z from 'zod';

import { definitionSchemaWithSlots } from '#src/schema/creator/schema-creator.js';

import type { baseTransformerSchema } from './types.js';

import { modelEntityType } from '../types.js';
import { modelTransformerSpec } from './model-transformer-spec.js';

export const createTransformerSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType },
  (ctx, slots) => {
    const { transformers } = ctx.plugins.use(modelTransformerSpec);
    return z.discriminatedUnion(
      'type',
      [...transformers.values()].map((transformer) =>
        transformer.createSchema(ctx, slots),
      ) as [typeof baseTransformerSchema],
    );
  },
);
