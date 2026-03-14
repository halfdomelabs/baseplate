import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createStripePluginDefinitionSchema = definitionSchema(() =>
  z.object({
    stripeOptions: z.object({}).prefault({}),
  }),
);

export type StripePluginDefinition = def.InferOutput<
  typeof createStripePluginDefinitionSchema
>;
export type StripePluginDefinitionInput = def.InferInput<
  typeof createStripePluginDefinitionSchema
>;
