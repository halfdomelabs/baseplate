import { z } from 'zod';

import { pluginConfigSpec, zWithPlugins } from '#src/plugins/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { pluginEntityType } from './entity-types.js';

export const basePluginDefinitionSchema = z.object({
  id: z.string(),
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

    const createConfigSchema = plugins
      .getPluginSpec(pluginConfigSpec)
      .getSchemaCreator(pluginKey);

    let pluginDefinitionSchema = basePluginDefinitionSchema;

    if (createConfigSchema) {
      pluginDefinitionSchema = pluginDefinitionSchema.extend({
        config: createConfigSchema(ctx),
      }) as typeof basePluginDefinitionSchema;
    }

    const pluginDefinitionWithEnt = ctx.withEnt(pluginDefinitionSchema, {
      type: pluginEntityType,
    });

    return pluginDefinitionWithEnt;
  }),
);

export const createPluginsSchema = definitionSchema((ctx) =>
  z.array(createPluginWithConfigSchema(ctx)),
);
