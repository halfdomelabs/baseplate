import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createPgBossPluginDefinitionSchema = definitionSchema(() =>
  z.object({
    // pg-boss specific configuration
    pgBossOptions: z
      .object({
        // Queue behavior options
        deleteAfterDays: z.coerce
          .number()
          .min(1)
          .default(7)
          .describe('Days to retain completed jobs'),
      })
      .default({}),
  }),
);

export type PgBossPluginDefinition = def.InferOutput<
  typeof createPgBossPluginDefinitionSchema
>;

export type PgBossPluginDefinitionInput = def.InferInput<
  typeof createPgBossPluginDefinitionSchema
>;
