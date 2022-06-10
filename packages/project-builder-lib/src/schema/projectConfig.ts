import { z } from 'zod';
import { randomUid } from '@src/utils/randomUid';
import { buildWebAppReferences, WebAppConfig, webAppSchema } from './apps';
import {
  AdminAppConfig,
  adminAppSchema,
  buildAdminAppReferences,
} from './apps/admin';
import { backendAppSchema } from './apps/backend';
import { authSchema, buildAuthReferences } from './auth';
import { buildModelReferences, modelSchema } from './models';
import { GetReferencesFunction, ReferencesBuilder } from './references';
import { buildStorageReferences, storageSchema } from './storage';

export const appSchema = z.discriminatedUnion('type', [
  backendAppSchema,
  webAppSchema,
  adminAppSchema,
]);

export type AppConfig = z.infer<typeof appSchema>;

export const projectConfigSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  // port to base the app ports on for development (e.g. 8000 => 8432 for DB)
  portBase: z.number(),
  apps: z.array(appSchema),
  features: z.array(
    z.object({
      uid: z.string().default(randomUid),
      name: z.string().min(1),
    })
  ),
  models: z.array(modelSchema),
  auth: authSchema.optional(),
  storage: storageSchema.optional(),
});

export type ProjectConfig = z.infer<typeof projectConfigSchema>;

export const getProjectConfigReferences: GetReferencesFunction<
  ProjectConfig
> = (config) => {
  const builder = new ReferencesBuilder<ProjectConfig>(config);
  config.features?.forEach((feature) => {
    builder.addReferenceable({
      category: 'feature',
      id: feature.uid,
      name: feature.name,
    });
  });

  config.apps?.forEach((app, idx) => {
    if (app.type === 'web') {
      buildWebAppReferences(
        app,
        builder.withPrefix(`apps.${idx}`) as ReferencesBuilder<WebAppConfig>
      );
    }
    if (app.type === 'admin') {
      buildAdminAppReferences(
        app,
        builder.withPrefix(`apps.${idx}`) as ReferencesBuilder<AdminAppConfig>
      );
    }
  });

  if (config.auth) {
    buildAuthReferences(config.auth, builder.withPrefix('auth'));
  }

  if (config.storage) {
    buildStorageReferences(config.storage, builder.withPrefix('storage'));
  }

  config.models?.forEach((model, idx) => {
    buildModelReferences(config, model, builder.withPrefix(`models.${idx}`));
  });

  return builder.build();
};
