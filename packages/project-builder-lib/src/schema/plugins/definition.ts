import { transformWithDynamicSchema } from '@halfdomelabs/utils';
import { z } from 'zod';

import { pluginConfigSpec } from '#src/plugins/index.js';
import { zEnt } from '#src/references/ref-builder.js';

import { definitionSchema } from '../creator/schema-creator.js';
import { pluginEntityType } from './entity-types.js';

export const basePluginDefinitionSchema = zEnt(
  z.object({
    packageName: z.string(),
    name: z.string(),
    version: z.string(),
    config: z.unknown(),
    configSchemaVersion: z.number().optional(),
  }),
  {
    type: pluginEntityType,
  },
);

export type BasePluginDefinition = z.infer<typeof basePluginDefinitionSchema>;

export const createPluginsDefinitionSchema = definitionSchema((ctx) =>
  z
    .array(
      basePluginDefinitionSchema.transform(
        transformWithDynamicSchema((data) => {
          const pluginId = pluginEntityType.toUid(data.id);

          const configSchema = ctx.plugins
            .getPluginSpec(pluginConfigSpec)
            .getSchema(pluginId);

          if (!configSchema) {
            return undefined;
          }

          return configSchema;
        }, 'config'),
      ),
    )
    .optional(),
);
