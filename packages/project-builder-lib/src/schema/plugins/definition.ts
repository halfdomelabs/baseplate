import { z } from 'zod';

import { pluginConfigSpec } from '#src/plugins/index.js';
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
  ctx
    .withEnt(basePluginDefinitionSchema.passthrough(), {
      type: pluginEntityType,
    })
    .transform((data, parseCtx) => {
      const pluginKey = pluginEntityType.keyFromId(data.id);

      const createConfigSchema = ctx.plugins
        .getPluginSpec(pluginConfigSpec)
        .getSchemaCreator(pluginKey);

      let pluginDefinitionSchema = basePluginDefinitionSchema;

      if (createConfigSchema) {
        pluginDefinitionSchema = pluginDefinitionSchema.extend({
          config: createConfigSchema(ctx),
        }) as typeof basePluginDefinitionSchema;
      }

      return pluginDefinitionSchema.parse(data, {
        path: parseCtx.path,
      });
    }),
);

export const createPluginsSchema = definitionSchema((ctx) =>
  z.array(createPluginWithConfigSchema(ctx)),
);
