import { z } from 'zod';

import { zRefBuilder } from '#src/references/index.js';

import type {
  InferDefinitionInput,
  InferDefinitionOutput,
  InferDefinitionSchema,
} from './creator/types.js';

import { adminAppSchema } from './apps/admin/index.js';
import { backendAppSchema } from './apps/backend/index.js';
import { webAppSchema } from './apps/index.js';
import { appEntityType } from './apps/types.js';
import { definitionSchema } from './creator/schema-creator.js';
import { featuresSchema } from './features/index.js';
import { enumSchema } from './models/enums.js';
import { modelSchema } from './models/index.js';
import { pluginsSchema } from './plugins/index.js';
import { createSettingsSchema } from './settings.js';

export const appSchema = zRefBuilder(
  z.discriminatedUnion('type', [
    backendAppSchema,
    webAppSchema,
    adminAppSchema,
  ]),
  (builder) => {
    builder.addEntity({
      type: appEntityType,
      addContext: 'app',
    });
  },
);

export type AppConfig = z.infer<typeof appSchema>;

export const createProjectDefinitionSchema = definitionSchema((ctx) =>
  z.object({
    cliVersion: z.string().nullish(),
    apps: z.array(appSchema).default([]),
    features: featuresSchema,
    models: z.array(modelSchema).default([]),
    enums: z.array(enumSchema).optional(),
    isInitialized: z.boolean().default(false),
    schemaVersion: z.number(),
    plugins: pluginsSchema.optional(),
    settings: createSettingsSchema(ctx),
  }),
);

export type ProjectDefinitionInput = InferDefinitionInput<
  typeof createProjectDefinitionSchema
>;

export type ProjectDefinition = InferDefinitionOutput<
  typeof createProjectDefinitionSchema
>;

export type ProjectDefinitionSchema = InferDefinitionSchema<
  typeof createProjectDefinitionSchema
>;
