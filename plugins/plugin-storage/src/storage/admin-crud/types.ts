import type { def } from '@baseplate-dev/project-builder-lib';

import {
  baseAdminCrudInputSchema,
  definitionSchemaWithSlots,
  modelEntityType,
  modelTransformerEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createAdminCrudFileInputSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType },
  (ctx, { modelSlot }) =>
    baseAdminCrudInputSchema.extend({
      type: z.literal('file'),
      modelRelationRef: ctx.withRef({
        type: modelTransformerEntityType,
        onDelete: 'RESTRICT',
        parentRef: modelSlot,
      }),
    }),
);

export type AdminCrudFileInputInput = def.InferInput<
  typeof createAdminCrudFileInputSchema
>;

export type AdminCrudFileInputDefinition = def.InferOutput<
  typeof createAdminCrudFileInputSchema
>;
