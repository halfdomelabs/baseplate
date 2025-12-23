import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createBullmqPluginDefinitionSchema = definitionSchema(() =>
  z.object({
    // BullMQ specific configuration
    bullmqOptions: z
      .object({
        // Queue behavior options
        deleteAfterDays: z
          .int()
          .min(1)
          .default(7)
          .describe('Days to retain completed jobs'),
      })
      .prefault({}),
  }),
);

export type BullmqPluginDefinition = def.InferOutput<
  typeof createBullmqPluginDefinitionSchema
>;

export type BullmqPluginDefinitionInput = def.InferInput<
  typeof createBullmqPluginDefinitionSchema
>;
