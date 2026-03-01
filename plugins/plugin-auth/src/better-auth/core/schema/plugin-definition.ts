import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createBetterAuthPluginDefinitionSchema = definitionSchema(() =>
  z.object({}),
);

export type BetterAuthPluginDefinitionInput = def.InferInput<
  typeof createBetterAuthPluginDefinitionSchema
>;
