import type { def } from '@baseplate-dev/project-builder-lib';

import {
  definitionSchema,
  modelEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createLocalAuthPluginDefinitionSchema = definitionSchema((ctx) =>
  z.object({
    modelRefs: z.object({
      user: ctx.withRef({
        type: modelEntityType,
        onDelete: 'RESTRICT',
      }),
      userAccount: ctx.withRef({
        type: modelEntityType,
        onDelete: 'RESTRICT',
      }),
      userRole: ctx.withRef({
        type: modelEntityType,
        onDelete: 'RESTRICT',
      }),
      userSession: ctx.withRef({
        type: modelEntityType,
        onDelete: 'RESTRICT',
      }),
    }),
  }),
);

export type LocalAuthPluginDefinition = def.InferOutput<
  typeof createLocalAuthPluginDefinitionSchema
>;

export type LocalAuthPluginDefinitionInput = def.InferInput<
  typeof createLocalAuthPluginDefinitionSchema
>;
