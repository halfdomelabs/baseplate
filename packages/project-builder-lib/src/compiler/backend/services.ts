import { ParsedProjectConfig } from '@src/parser';
import { ParsedModel } from '@src/parser/types';
import { TransformerConfig } from '@src/schema/models/transformers';

function buildTransformer(transformer: TransformerConfig): unknown {
  const { type, ...config } = transformer;
  switch (transformer.type) {
    case 'embeddedRelation':
      return {
        generator: '@baseplate/fastify/prisma/embedded-relation-transformer',
        ...config,
      };
    case 'password':
      return {
        name: transformer.name,
        generator: '@baseplate/fastify/auth/prisma-password-transformer',
      };
    default:
      throw new Error(
        `Unknown transformer type: ${(transformer as { type: string }).type}`
      );
  }
}

function buildServiceForModel(model: ParsedModel): unknown {
  const { service } = model;
  if (!service) {
    return undefined;
  }

  return {
    name: `${model.name}Service`,
    generator: '@baseplate/fastify/core/service-file',
    children: {
      $crud: {
        generator: '@baseplate/fastify/prisma/prisma-crud-service',
        modelName: model.name,
        children: {
          transformers: service.transformers?.map((transfomer) =>
            buildTransformer(transfomer)
          ),
          create: {
            prismaFields: service.create?.fields,
            transformerNames: service.create?.transformerNames,
          },
          update: {
            prismaFields: service.update?.fields,
            transformerNames: service.create?.transformerNames,
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
