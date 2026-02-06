import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createRateLimitPluginDefinitionSchema = definitionSchema(() =>
  z.object({
    // Rate limit plugin configuration - currently no options needed
    // The Prisma model is defined via the project builder UI
    rateLimitOptions: z.object({}).prefault({}),
  }),
);

export type RateLimitPluginDefinition = def.InferOutput<
  typeof createRateLimitPluginDefinitionSchema
>;

export type RateLimitPluginDefinitionInput = def.InferInput<
  typeof createRateLimitPluginDefinitionSchema
>;
