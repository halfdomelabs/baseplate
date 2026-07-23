import type { def } from '@baseplate-dev/project-builder-lib';

import {
  definitionSchema,
  featureEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createEmailPluginDefinitionSchema = definitionSchema((ctx) =>
  z.object({
    emailFeatureRef: ctx.withRef({
      type: featureEntityType,
      onDelete: 'RESTRICT',
    }),
    implementationPluginKey: z
      .string()
      .min(1, 'Email implementation plugin must be selected'),
  }),
);

export type EmailPluginDefinition = def.InferOutput<
  typeof createEmailPluginDefinitionSchema
>;

export type EmailPluginDefinitionInput = def.InferInput<
  typeof createEmailPluginDefinitionSchema
>;
