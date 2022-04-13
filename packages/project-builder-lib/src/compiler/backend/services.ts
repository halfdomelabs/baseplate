import { ParsedProjectConfig } from '@src/parser';
import { ParsedModel } from '@src/parser/types';

function buildServiceForModel(model: ParsedModel): unknown {
  const { service } = model;
  if (!service) {
    return undefined;
  }
  const createTransformers: Record<string, unknown> =
    service.createTransformers || {};
  const updateTransformers: Record<string, unknown> =
    service.updateTransformers || {};

  service.embeddedRelations
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
            prismaFields: service.create?.fields,
            children: createTransformers,
          },
          update: {
            prismaFields: service.update?.fields,
            children: updateTransformers,
          },
        },
      },
    },
  };
}

export function buildServicesForFeature(
  feature: string,
  parsedProjectConfig: ParsedProjectConfig
): unknown {
  const models =
    parsedProjectConfig
      .getModels()
      .filter((m) => m.feature === feature && m.service?.build) || [];
  return models.map((model) => buildServiceForModel(model));
}
