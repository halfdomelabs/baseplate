import type { def } from '@baseplate-dev/project-builder-lib';

import {
  definitionSchema,
  featureEntityType,
  modelEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { createAuthRolesSchema } from '#src/roles/index.js';

export const createAuth0PluginDefinitionSchema = definitionSchema((ctx) =>
  z.object({
    modelRefs: z.object({
      user: ctx.withRef(z.string().min(1), {
        type: modelEntityType,
        onDelete: 'RESTRICT',
      }),
    }),
    authFeatureRef: ctx.withRef(z.string().min(1), {
      type: featureEntityType,
      onDelete: 'RESTRICT',
    }),
    roles: createAuthRolesSchema(ctx),
  }),
);

export type Auth0PluginDefinition = def.InferOutput<
  typeof createAuth0PluginDefinitionSchema
>;

export type Auth0PluginDefinitionInput = def.InferInput<
  typeof createAuth0PluginDefinitionSchema
>;
