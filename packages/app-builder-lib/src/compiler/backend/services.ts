import { ParsedAppConfig } from '@src/parser';
import { ModelConfig } from '../../schema/models';

function buildServiceForModel(
  model: ModelConfig,
  parsedAppConfig: ParsedAppConfig
): unknown {
  const createAdditions: Record<string, unknown> = {};
  const updateAdditions: Record<string, unknown> = {};

  if (parsedAppConfig.appConfig.auth?.passwordProvider) {
    if (model.name === parsedAppConfig.appConfig.auth.userModel) {
      createAdditions.$passwordHash = {
        generator: '@baseplate/fastify/auth/password-create-transformer',
      };
      updateAdditions.$passwordHash = {
        generator: '@baseplate/fastify/auth/password-update-transformer',
      };
    }
  }

  model.embeddedRelations
    ?.map((config) => ({
      localRelationName: config.localRelationName,
      embeddedFieldNames: config.embeddedFieldNames,
    }))
    .forEach((config) => {
      createAdditions[`$${config.localRelationName}`] = {
        generator: '@baseplate/fastify/prisma/embedded-relation-transformer',
        ...config,
        isUpdate: false,
      };
      updateAdditions[`$${config.localRelationName}`] = {
        generator: '@baseplate/fastify/prisma/embedded-relation-transformer',
        ...config,
        isUpdate: true,
      };
    });

  return {
    name: `${model.name}Service`,
    generator: '@baseplate/fastify/core/service-file',
    children: {
      $crud: {
        generator: '@baseplate/fastify/prisma/prisma-crud-service',
        modelName: model.name,
        children: {
          create: {
            prismaFields: model.fields
              ?.filter((f) => f.creatable)
              .map((f) => f.name),
            children: createAdditions,
          },
          update: {
            prismaFields: model.fields
              ?.filter((f) => f.updatable)
              .map((f) => f.name),
            children: updateAdditions,
          },
        },
      },
    },
  };
}

export function buildServicesForFeature(
  feature: string,
  parsedAppConfig: ParsedAppConfig
): unknown {
  const models =
    parsedAppConfig
      .getModels()
      .filter((m) => m.feature === feature && m.generateService) || [];
  return models.map((model) => buildServiceForModel(model, parsedAppConfig));
}
