import {
  featureEntityType,
  modelEntityType,
  zRef,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { authRolesSchema } from '#src/roles/index.js';

export const auth0PluginDefinitionSchema = z.object({
  modelRefs: z.object({
    user: zRef(z.string().min(1), {
      type: modelEntityType,
      onDelete: 'RESTRICT',
    }),
  }),
  authFeatureRef: zRef(z.string().min(1), {
    type: featureEntityType,
    onDelete: 'RESTRICT',
  }),
  roles: authRolesSchema,
});

export type Auth0PluginDefinition = z.infer<typeof auth0PluginDefinitionSchema>;

export type Auth0PluginDefinitionInput = z.input<
  typeof auth0PluginDefinitionSchema
>;
