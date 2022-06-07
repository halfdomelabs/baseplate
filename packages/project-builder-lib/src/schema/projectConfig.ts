import * as yup from 'yup';
import { randomUid } from '@src/utils/randomUid';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';
import {
  BaseAppConfig,
  buildWebAppReferences,
  WebAppConfig,
  webAppSchema,
} from './apps';
import {
  AdminAppConfig,
  adminAppSchema,
  buildAdminAppReferences,
} from './apps/admin';
import { BackendAppConfig, backendAppSchema } from './apps/backend';
import { authSchema, buildAuthReferences } from './auth';
import { buildModelReferences, modelSchema } from './models';
import { GetReferencesFunction, ReferencesBuilder } from './references';
import { buildStorageReferences, storageSchema } from './storage';

export type AppConfig = BackendAppConfig | WebAppConfig | AdminAppConfig;

export const projectConfigSchema = yup.object({
  name: yup.string().required(),
  version: yup.string().required(),
  // port to base the app ports on for development (e.g. 8000 => 8432 for DB)
  portBase: yup.number().required(),
  apps: yup
    .array()
    .of(
      yup.lazy((value: AppConfig) => {
        if (value.type === 'backend') {
          return backendAppSchema;
        }
        if (value.type === 'web') {
          return webAppSchema;
        }
        if (value.type === 'admin') {
          return adminAppSchema;
        }
        throw new Error(`Unknown app type: ${(value as BaseAppConfig).type}`);
      }) as unknown as yup.SchemaOf<AppConfig>
    )
    .required(),
  features: yup.array(
    yup.object({
      uid: yup.string().default(randomUid),
      name: yup.string().required(),
    })
  ),
  models: yup.array(modelSchema),
  auth: authSchema.optional().default(undefined),
  storage: storageSchema.optional().default(undefined),
});

export type ProjectConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof projectConfigSchema>
>;

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
