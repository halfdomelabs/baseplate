import type { def } from '@baseplate-dev/project-builder-lib';

import {
  definitionSchema,
  featureEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createRateLimitPluginDefinitionSchema = definitionSchema((ctx) =>
  z.object({
    rateLimitFeatureRef: ctx.withRef({
      type: featureEntityType,
      onDelete: 'RESTRICT',
    }),
    rateLimitOptions: z.object({}).prefault({}),
  }),
);

export type RateLimitPluginDefinition = def.InferOutput<
  typeof createRateLimitPluginDefinitionSchema
>;

export type RateLimitPluginDefinitionInput = def.InferInput<
  typeof createRateLimitPluginDefinitionSchema
>;
