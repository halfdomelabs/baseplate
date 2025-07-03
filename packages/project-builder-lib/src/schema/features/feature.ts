import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { createEntityType } from '#src/references/types.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

export const featureEntityType = createEntityType('feature');

export const featureNameSchema = CASE_VALIDATORS.KEBAB_CASE;

export const createFeatureSchema = definitionSchema((ctx) =>
  ctx.withEnt(
    z.object({
      id: z.string(),
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
      parentRef: ctx.withRef(z.string().nullish(), {
        type: featureEntityType,
        onDelete: 'DELETE_PARENT',
      }),
    }),
    { type: featureEntityType },
  ),
);

export type FeatureConfig = def.InferOutput<typeof createFeatureSchema>;

export const createFeaturesSchema = definitionSchema((ctx) =>
  z.array(createFeatureSchema(ctx)).default([]),
);
