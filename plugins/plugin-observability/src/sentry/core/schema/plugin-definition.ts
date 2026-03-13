import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createSentryPluginDefinitionSchema = definitionSchema(() =>
  z.object({
    sentryOptions: z.object({}).prefault({}),
  }),
);

export type SentryPluginDefinition = def.InferOutput<
  typeof createSentryPluginDefinitionSchema
>;
export type SentryPluginDefinitionInput = def.InferInput<
  typeof createSentryPluginDefinitionSchema
>;
