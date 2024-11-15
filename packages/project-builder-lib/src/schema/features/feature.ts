import { z } from 'zod';

import { createEntityType, zEnt, zRef } from '@src/references/index.js';

import { VALIDATORS } from '../utils/validation.js';

export const featureEntityType = createEntityType('feature');

export const featureNameSchema = VALIDATORS.DASHED_NAME;

export const featureSchema = zEnt(
  z.object({
    name: z
      .string()
      .min(1)
      .refine(
        (name) =>
          name
            .split('/')
            .every((part) => featureNameSchema.safeParse(part).success),
        {
          message:
            'Feature name must be lowercase and contain only letters, numbers, and dashes',
        },
      ),
    parentRef: zRef(z.string().nullish(), {
      type: featureEntityType,
      onDelete: 'DELETE_PARENT',
    }),
  }),
  { type: featureEntityType },
);

export type FeatureConfig = z.infer<typeof featureSchema>;

export const featuresSchema = z.array(featureSchema).default([]);
