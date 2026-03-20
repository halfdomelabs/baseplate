import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createResendPluginDefinitionSchema = definitionSchema(() =>
  z.object({
    // Resend specific configuration - currently no options needed
    resendOptions: z.object({}).prefault({}),
  }),
);

export type ResendPluginDefinition = def.InferOutput<
  typeof createResendPluginDefinitionSchema
>;

export type ResendPluginDefinitionInput = def.InferInput<
  typeof createResendPluginDefinitionSchema
>;
