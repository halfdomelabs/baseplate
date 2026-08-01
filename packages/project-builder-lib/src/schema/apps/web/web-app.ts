import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { withDefault } from '#src/schema/creator/index.js';
import { definitionSchemaWithSlots } from '#src/schema/creator/schema-creator.js';
import { libraryEntityType } from '#src/schema/libraries/types.js';

import { baseAppValidators } from '../base.js';
import { appEntityType, createAppEntryType } from '../types.js';
import { createAdminAppSchema } from './admin/admin.js';
import { webAppSchemaExtensionSpec } from './web-app-schema-extension-spec.js';

export const createWebAppSchema = definitionSchemaWithSlots(
  { appSlot: appEntityType },
  (ctx, { appSlot }) => {
    // Merge plugin-contributed per-app settings under `pluginData[pluginKey]`.
    // Plugins register their schema slice via `webAppSchemaExtensionSpec`,
    // keeping per-app opt-in flags out of this core schema. Mirrors
    // `createPluginWithConfigSchema`: iterate all loaded plugin keys and fall
    // back to `z.unknown()` so a plugin's data is preserved even when its schema
    // creator isn't registered in the current parser context.
    const pluginKeys = ctx.plugins.getPluginKeys();
    const schemaCreators = ctx.plugins
      .use(webAppSchemaExtensionSpec)
      .getAllSchemaCreators();
    const pluginDataSchema = z.object(
      Object.fromEntries(
        pluginKeys.map((pluginKey) => [
          pluginKey,
          (schemaCreators.get(pluginKey)?.(ctx) ?? z.unknown()).optional(),
        ]),
      ),
    );

    return z.object({
      ...baseAppValidators,
      devPort: z.number().int().positive(),
      type: z.literal('web'),
      title: z.string().default(''),
      description: z.string().default(''),
      enableSubscriptions: ctx.withDefault(z.boolean(), false),
      pluginData: pluginDataSchema.optional(),
      adminApp: createAdminAppSchema(ctx, { appSlot }),
      libraryRefs: z
        .array(
          ctx.withRef({
            type: libraryEntityType,
            onDelete: 'RESTRICT',
          }),
        )
        .apply(withDefault([])),
    });
  },
);

export type WebAppConfig = def.InferOutput<typeof createWebAppSchema>;

export const webAppEntryType = createAppEntryType<WebAppConfig>('web');
