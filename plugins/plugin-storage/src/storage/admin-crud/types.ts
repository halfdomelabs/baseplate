import type { def } from '@baseplate-dev/project-builder-lib';

import {
  baseAdminCrudInputSchema,
  definitionSchema,
  modelTransformerEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createAdminCrudFileInputSchema = definitionSchema((ctx) =>
  baseAdminCrudInputSchema.extend({
    type: z.literal('file'),
    modelRelationRef: ctx.withRef({
      type: modelTransformerEntityType,
      onDelete: 'RESTRICT',
      parentPath: { context: 'model' },
    }),
  }),
);

export type AdminCrudFileInputInput = def.InferInput<
  typeof createAdminCrudFileInputSchema
>;

export type AdminCrudFileInputDefinition = def.InferOutput<
  typeof createAdminCrudFileInputSchema
>;
