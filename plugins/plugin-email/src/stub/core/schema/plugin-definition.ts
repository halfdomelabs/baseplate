import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createStubPluginDefinitionSchema = definitionSchema(() =>
  z.object({
    stubOptions: z
      .object({
        providerName: z
          .string()
          .min(1)
          .default('stub')
          .describe(
            'Name for the generated email provider (e.g. "sendgrid", "ses", "mailgun")',
          ),
      })
      .prefault({}),
  }),
);

export type StubPluginDefinition = def.InferOutput<
  typeof createStubPluginDefinitionSchema
>;

export type StubPluginDefinitionInput = def.InferInput<
  typeof createStubPluginDefinitionSchema
>;
