import { z } from 'zod';

import type { def } from './creator/index.js';

import { createBackendAppSchema } from './apps/backend/index.js';
import { createWebAppSchema } from './apps/index.js';
import { appEntityType } from './apps/types.js';
import { definitionSchema } from './creator/schema-creator.js';
import { createFeaturesSchema } from './features/index.js';
import { createEnumSchema } from './models/enums.js';
import { createModelSchema } from './models/index.js';
import { createLibrarySchema } from './packages/library.js';
import { createPluginsSchema } from './plugins/index.js';
import { createSettingsSchema } from './settings/index.js';

export const createAppSchema = definitionSchema((ctx) =>
  ctx.refContext({ appSlot: appEntityType }, ({ appSlot }) =>
    ctx.withEnt(
      z.discriminatedUnion('type', [
        createBackendAppSchema(ctx, { appSlot }),
        createWebAppSchema(ctx, { appSlot }),
      ]),
      {
        type: appEntityType,
        provides: appSlot,
      },
    ),
  ),
);

export type AppConfig = def.InferOutput<typeof createAppSchema>;

export const createProjectDefinitionSchema = definitionSchema((ctx) =>
  z.object({
    cliVersion: z.string().nullish(),
    apps: z.array(createAppSchema(ctx)).default([]),
    packages: z.array(createLibrarySchema(ctx)).default([]),
    features: createFeaturesSchema(ctx),
    models: z.array(createModelSchema(ctx)).default([]),
    enums: z.array(createEnumSchema(ctx)).optional(),
    isInitialized: z.boolean().default(false),
    schemaVersion: z.number(),
    plugins: createPluginsSchema(ctx).optional(),
    settings: createSettingsSchema(ctx),
  }),
);

export type ProjectDefinitionInput = def.InferInput<
  typeof createProjectDefinitionSchema
>;

export type ProjectDefinition = def.InferOutput<
  typeof createProjectDefinitionSchema
>;

export type ProjectDefinitionSchema = def.InferSchema<
  typeof createProjectDefinitionSchema
>;
