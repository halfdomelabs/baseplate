import type { def } from '@baseplate-dev/project-builder-lib';

import {
  definitionSchema,
  featureEntityType,
  modelEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { createAuthRolesSchema } from '#src/common/roles/index.js';

export const createPlaceholderAuthPluginDefinitionSchema = definitionSchema(
  (ctx) =>
    z.object({
      modelRefs: z.object({
        user: ctx.withRef({
          type: modelEntityType,
          onDelete: 'RESTRICT',
        }),
      }),
      authFeatureRef: ctx.withRef({
        type: featureEntityType,
        onDelete: 'RESTRICT',
      }),
      roles: createAuthRolesSchema(ctx),
    }),
);

export type PlaceholderAuthPluginDefinition = def.InferOutput<
  typeof createPlaceholderAuthPluginDefinitionSchema
>;

export type PlaceholderAuthPluginDefinitionInput = def.InferInput<
  typeof createPlaceholderAuthPluginDefinitionSchema
>;
