import type { def } from '@baseplate-dev/project-builder-lib';

import {
  definitionSchema,
  modelTransformerEntityType,
  zRef,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const adminCrudFileInputSchema = definitionSchema(() =>
  z.object({
    type: z.literal('file'),
    label: z.string().min(1),
    modelRelationRef: zRef(z.string(), {
      type: modelTransformerEntityType,
      onDelete: 'RESTRICT',
      parentPath: { context: 'model' },
    }),
  }),
);

export type AdminCrudFileInputConfig = def.InferInput<
  typeof adminCrudFileInputSchema
>;
