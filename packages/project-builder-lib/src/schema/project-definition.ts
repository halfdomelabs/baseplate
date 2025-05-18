import { z } from 'zod';

import { zRefBuilder } from '@src/references/index.js';
import { DASHED_NAME } from '@src/utils/validations.js';

import { adminAppSchema } from './apps/admin/index.js';
import { backendAppSchema } from './apps/backend/index.js';
import { webAppSchema } from './apps/index.js';
import { appEntityType } from './apps/types.js';
import { featuresSchema } from './features/index.js';
import { themeSchema } from './features/theme.js';
import { enumSchema } from './models/enums.js';
import { modelSchema } from './models/index.js';
import { pluginsSchema } from './plugins/index.js';
import { templateExtractorSchema } from './template-extractor/index.js';

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

export const projectDefinitionSchema = z.object({
  name: DASHED_NAME,
  packageScope: DASHED_NAME.optional(),
  version: z.string().min(1).default('0.1.0'),
  cliVersion: z.string().nullish().default('0.2.3'),
  // port to base the app ports on for development (e.g. 8000 => 8432 for DB)
  portOffset: z
    .number()
    .min(1000)
    .max(60_000)
    .int()
    .refine(
      (portOffset) => portOffset % 1000 === 0,
      'Port offset must be a multiple of 1000, e.g. 1000, 2000, 3000, etc.',
    ),
  apps: z.array(appSchema).default([]),
  features: featuresSchema,
  models: z.array(modelSchema).default([]),
  enums: z.array(enumSchema).optional(),
  isInitialized: z.boolean().default(false),
  schemaVersion: z.number(),
  theme: themeSchema.optional(),
  plugins: pluginsSchema.optional(),
  templateExtractor: templateExtractorSchema.optional(),
});

export type ProjectDefinitionInput = z.input<typeof projectDefinitionSchema>;

export type ProjectDefinition = z.infer<typeof projectDefinitionSchema>;
