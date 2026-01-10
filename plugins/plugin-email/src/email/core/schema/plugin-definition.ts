import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createEmailPluginDefinitionSchema = definitionSchema(() =>
  z.object({
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
