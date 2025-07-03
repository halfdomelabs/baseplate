import type { def } from '@baseplate-dev/project-builder-lib';

import {
  definitionSchema,
  modelTransformerEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const adminCrudFileInputSchema = definitionSchema((ctx) =>
  z.object({
    type: z.literal('file'),
    label: z.string().min(1),
    modelRelationRef: ctx.withRef({
      type: modelTransformerEntityType,
      onDelete: 'RESTRICT',
      parentPath: { context: 'model' },
    }),
  }),
);

export type AdminCrudFileInputConfig = def.InferInput<
  typeof adminCrudFileInputSchema
>;
