import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createQueuePluginDefinitionSchema = definitionSchema(() =>
  z.object({
    implementationPluginKey: z
      .string()
      .min(1, 'Queue implementation plugin must be selected'),
  }),
);

export type QueuePluginDefinition = def.InferOutput<
  typeof createQueuePluginDefinitionSchema
>;

export type QueuePluginDefinitionInput = def.InferInput<
  typeof createQueuePluginDefinitionSchema
>;
