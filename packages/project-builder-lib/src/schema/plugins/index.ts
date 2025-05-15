import { z } from 'zod';

import { pluginConfigSpec, zWithPlugins } from '@src/plugins/index.js';
import { zEnt } from '@src/references/ref-builder.js';
import { createEntityType } from '@src/references/types.js';

export const pluginEntityType = createEntityType('plugin');

export const basePluginSchema = zEnt(
  z.object({
    packageName: z.string(),
    name: z.string(),
    version: z.string(),
    config: z.unknown(),
  }),
  {
    type: pluginEntityType,
  },
);

export type BasePlugin = z.infer<typeof basePluginSchema>;

export const pluginWithConfigSchema = zWithPlugins((plugins, data) => {
  const parsedBasePluginSchema = basePluginSchema.parse(data);

  const pluginId = pluginEntityType.toUid(parsedBasePluginSchema.id);

  const configSchema = plugins
    .getPluginSpec(pluginConfigSpec)
    .getSchema(pluginId);

  if (!configSchema) {
    return basePluginSchema;
  }

  return basePluginSchema.and(
    z.object({
      config: configSchema,
    }),
  );
});

export const pluginsSchema = z.array(pluginWithConfigSchema);
