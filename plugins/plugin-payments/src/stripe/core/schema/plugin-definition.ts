import type { def } from '@baseplate-dev/project-builder-lib';

import {
  definitionSchema,
  featureEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createStripePluginDefinitionSchema = definitionSchema((ctx) =>
  z.object({
    stripeOptions: z.object({}).prefault({}),
    billingFeatureRef: ctx
      .withRef({
        type: featureEntityType,
        onDelete: 'RESTRICT',
      })
      .optional(),
  }),
);

export type StripePluginDefinition = def.InferOutput<
  typeof createStripePluginDefinitionSchema
>;
export type StripePluginDefinitionInput = def.InferInput<
  typeof createStripePluginDefinitionSchema
>;
