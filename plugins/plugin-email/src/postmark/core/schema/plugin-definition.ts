import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createPostmarkPluginDefinitionSchema = definitionSchema(() =>
  z.object({
    // Postmark specific configuration - currently no options needed
    postmarkOptions: z.object({}).prefault({}),
  }),
);

export type PostmarkPluginDefinition = def.InferOutput<
  typeof createPostmarkPluginDefinitionSchema
>;

export type PostmarkPluginDefinitionInput = def.InferInput<
  typeof createPostmarkPluginDefinitionSchema
>;
