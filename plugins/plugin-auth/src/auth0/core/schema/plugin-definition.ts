import type { def } from '@baseplate-dev/project-builder-lib';

import {
  definitionSchema,
  modelEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createAuth0PluginDefinitionSchema = definitionSchema((ctx) =>
  z.object({
    modelRefs: z.object({
      user: ctx.withRef({
        type: modelEntityType,
        onDelete: 'RESTRICT',
      }),
    }),
  }),
);

export type Auth0PluginDefinition = def.InferOutput<
  typeof createAuth0PluginDefinitionSchema
>;

export type Auth0PluginDefinitionInput = def.InferInput<
  typeof createAuth0PluginDefinitionSchema
>;
