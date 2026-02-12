import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createAuth0PluginDefinitionSchema = definitionSchema(() =>
  z.object({}),
);

export type Auth0PluginDefinitionInput = def.InferInput<
  typeof createAuth0PluginDefinitionSchema
>;
