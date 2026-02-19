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

export const createPluginWithConfigSchema = definitionSchema((ctx) => {
  const pluginKeys = ctx.plugins.getPluginKeys();
  const schemaCreators = ctx.plugins
    .use(pluginConfigSpec)
    .getAllSchemaCreators();

  if (pluginKeys.length === 0) {
    // Create a fresh schema instance to avoid accumulating entity metadata
    // on the shared basePluginDefinitionSchema via the global ref registry.
    return ctx.withEnt(
      basePluginDefinitionSchema.refine(() => true),
      {
        type: pluginEntityType,
      },
    );
  }

  const variants = pluginKeys.map((key) => {
    const configSchema = schemaCreators.get(key)?.(ctx) ?? z.unknown();
    return z.object({
      id: z.literal(pluginEntityType.idFromKey(key)),
      packageName: z.string(),
      name: z.string(),
      version: z.string(),
      config: configSchema,
      configSchemaVersion: z.number().optional(),
    });
  });

  return ctx.withEnt(
    z.discriminatedUnion(
      'id',
      variants as unknown as [typeof basePluginDefinitionSchema],
    ),
    {
      type: pluginEntityType,
    },
  );
});

export const createPluginsSchema = definitionSchema((ctx) =>
  z.array(createPluginWithConfigSchema(ctx)),
);
