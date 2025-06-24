import { z } from 'zod';

import { pluginConfigSpec, zWithPlugins } from '#src/plugins/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { pluginEntityType } from './entity-types.js';

export const basePluginDefinitionSchema = z.object({
  id: z.string().min(1),
  packageName: z.string(),
  name: z.string(),
  version: z.string(),
  config: z.unknown(),
  configSchemaVersion: z.number().optional(),
});

export type BasePluginDefinition = z.infer<typeof basePluginDefinitionSchema>;

export const createPluginWithConfigSchema = definitionSchema((ctx) =>
  zWithPlugins((plugins, data) => {
    const parsedBasePlugin = basePluginDefinitionSchema.parse(data);

    const pluginKey = pluginEntityType.keyFromId(parsedBasePlugin.id);

    const configSchema = plugins
      .getPluginSpec(pluginConfigSpec)
      .getSchema(pluginKey);

    const pluginDefinitionWithEnt = ctx.withEnt(basePluginDefinitionSchema, {
      type: pluginEntityType,
    });

    if (!configSchema) {
      return pluginDefinitionWithEnt;
    }

    return pluginDefinitionWithEnt.and(
      z.object({
        config: configSchema,
      }),
    );
  }),
);

export const createPluginsSchema = definitionSchema((ctx) =>
  z.array(createPluginWithConfigSchema(ctx)),
);
