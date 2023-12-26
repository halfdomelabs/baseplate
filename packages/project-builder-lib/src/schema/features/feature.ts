import { z } from 'zod';

import { createEntityType, zEnt, zRef } from '@src/references/index.js';

export const featureEntityType = createEntityType('feature');

export const featureSchema = zEnt(
  z.object({
    name: z.string().min(1),
    parentRef: zRef(z.string().nullish(), {
      type: featureEntityType,
      onDelete: 'DELETE_PARENT',
    }),
  }),
  { type: featureEntityType },
);

export type FeatureConfig = z.infer<typeof featureSchema>;

export const featuresSchema = z.array(featureSchema).default([]);
