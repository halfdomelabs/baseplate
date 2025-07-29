import type { def } from '@baseplate-dev/project-builder-lib';

import {
  definitionSchema,
  modelEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createPlaceholderAuthPluginDefinitionSchema = definitionSchema(
  (ctx) =>
    z.object({
      modelRefs: z.object({
        user: ctx.withRef({
          type: modelEntityType,
          onDelete: 'RESTRICT',
        }),
      }),
    }),
);

export type PlaceholderAuthPluginDefinition = def.InferOutput<
  typeof createPlaceholderAuthPluginDefinitionSchema
>;
