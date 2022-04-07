import { ParsedAppConfig } from '@src/parser';
import { ParsedModel } from '@src/parser/types';

function buildServiceForModel(model: ParsedModel): unknown {
  const createTransformers: Record<string, unknown> =
    model.service?.createTransformers || {};
  const updateTransformers: Record<string, unknown> =
    model.service?.updateTransformers || {};

  model.service?.embeddedRelations
    ?.map((config) => ({
      localRelationName: config.localRelationName,
      embeddedFieldNames: config.embeddedFieldNames,
    }))
    .forEach((config) => {
      createTransformers[`$${config.localRelationName}`] = {
        generator: '@baseplate/fastify/prisma/embedded-relation-transformer',
        ...config,
        isUpdate: false,
      };
      updateTransformers[`$${config.localRelationName}`] = {
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
            prismaFields: model.model.fields
              ?.filter((f) => f.service?.creatable)
              .map((f) => f.name),
            children: createTransformers,
          },
          update: {
            prismaFields: model.model.fields
              ?.filter((f) => f.service?.updatable)
              .map((f) => f.name),
            children: updateTransformers,
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
      .filter((m) => m.feature === feature && m.service?.build) || [];
  return models.map((model) => buildServiceForModel(model));
}
