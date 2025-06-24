import { z } from 'zod';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';
import { featureEntityType } from '#src/schema/features/index.js';

import { adminSectionEntityType } from './types.js';

export const createBaseAdminSectionValidators = definitionSchema((ctx) =>
  z.object({
    id: z.string().default(adminSectionEntityType.generateNewId()),
    name: z.string().min(1),
    featureRef: ctx.withRef(z.string().min(1), {
      type: featureEntityType,
      onDelete: 'RESTRICT',
    }),
    icon: z.string().optional(),
    type: z.string().min(1),
  }),
);
