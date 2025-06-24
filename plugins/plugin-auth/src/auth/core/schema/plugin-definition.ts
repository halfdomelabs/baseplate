import type { def } from '@baseplate-dev/project-builder-lib';

import {
  definitionSchema,
  featureEntityType,
  modelEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { createAuthRolesSchema } from '#src/roles/index.js';

export const createAuthPluginDefinitionSchema = definitionSchema((ctx) =>
  z.object({
    modelRefs: z.object({
      user: ctx.withRef(z.string().min(1), {
        type: modelEntityType,
        onDelete: 'RESTRICT',
      }),
      userAccount: ctx.withRef(z.string().min(1), {
        type: modelEntityType,
        onDelete: 'RESTRICT',
      }),
      userRole: ctx.withRef(z.string().min(1), {
        type: modelEntityType,
        onDelete: 'RESTRICT',
      }),
      userSession: ctx.withRef(z.string().min(1), {
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

export type AuthPluginDefinition = def.InferOutput<
  typeof createAuthPluginDefinitionSchema
>;

export type AuthPluginDefinitionInput = def.InferInput<
  typeof createAuthPluginDefinitionSchema
>;
