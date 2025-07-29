import type { def } from '@baseplate-dev/project-builder-lib';

import {
  definitionSchema,
  featureEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { createAuthRolesSchema } from '#src/common/roles/index.js';

export const createAuthPluginDefinitionSchema = definitionSchema((ctx) =>
  z.object({
    implementationPluginKey: z
      .string()
      .min(1, 'Auth implementation plugin must be selected'),
    authFeatureRef: ctx.withRef({
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
