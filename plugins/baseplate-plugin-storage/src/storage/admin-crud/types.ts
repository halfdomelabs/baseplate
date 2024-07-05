import {
  modelTransformerEntityType,
  zRef,
} from '@halfdomelabs/project-builder-lib';
import { z } from 'zod';

export const adminCrudFileInputSchema = z.object({
  type: z.literal('file'),
  label: z.string().min(1),
  modelRelation: zRef(z.string(), {
    type: modelTransformerEntityType,
    onDelete: 'RESTRICT',
    parentPath: { context: 'model' },
  }),
});

export type AdminCrudFileInputConfig = z.infer<typeof adminCrudFileInputSchema>;
