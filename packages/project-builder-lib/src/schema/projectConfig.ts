import { z } from 'zod';

import { adminAppSchema } from './apps/admin/index.js';
import { backendAppSchema } from './apps/backend/index.js';
import { webAppSchema } from './apps/index.js';
import { appEntityType } from './apps/types.js';
import { authSchema } from './auth/index.js';
import { featuresSchema } from './features/index.js';
import { themeSchema } from './features/theme.js';
import { enumSchema } from './models/enums.js';
import { modelSchema } from './models/index.js';
import { storageSchema } from './storage/index.js';
import { zRefBuilder } from '@src/index.js';
import { DASHED_NAME } from '@src/utils/validations.js';

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

export const projectConfigSchema = z.object({
  name: DASHED_NAME,
  packageScope: DASHED_NAME.optional(),
  version: z.string().min(1).default('0.1.0'),
  cliVersion: z.string().nullish().default('0.2.3'),
  // port to base the app ports on for development (e.g. 8000 => 8432 for DB)
  portOffset: z
    .number()
    .min(1000)
    .max(60000)
    .int()
    .refine(
      (portOffset) => portOffset % 1000 === 0,
      'Port offset must be a multiple of 1000, e.g. 1000, 2000, 3000, etc.',
    ),
  apps: z.array(appSchema).default([]),
  features: featuresSchema,
  models: z.array(modelSchema).default([]),
  enums: z.array(enumSchema).optional(),
  auth: authSchema.optional(),
  storage: storageSchema.optional(),
  isInitialized: z.boolean().default(false),
  schemaVersion: z.number().nullish(),
  theme: themeSchema.optional(),
});

export type ProjectConfigInput = z.input<typeof projectConfigSchema>;

export type ProjectConfig = z.infer<typeof projectConfigSchema>;
