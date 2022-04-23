import { ParsedProjectConfig } from '@src/parser';
import { ParsedModel } from '@src/parser/types';
import {
  EmbeddedRelationTransformerConfig,
  TransformerConfig,
} from '@src/schema/models/transformers';

function buildEmbeddedRelationTransformer(
  transformer: EmbeddedRelationTransformerConfig,
  model: ParsedModel,
  parsedProject: ParsedProjectConfig
): unknown {
  const { type, ...config } = transformer;

  // find foreign relation
  const foreignModel = parsedProject
    .getModels()
    .find((m) =>
      m.model.relations?.some(
        (r) =>
          r.foreignRelationName === transformer.name &&
          r.modelName === model.name
      )
    );

  if (!foreignModel) {
    throw new Error(
      `Could not find relation ${transformer.name} for embedded relation transformer`
    );
  }

  return {
    generator: '@baseplate/fastify/prisma/embedded-relation-transformer',
    foreignCrudServiceRef: !transformer.embeddedTransformerNames
      ? undefined
      : `${foreignModel.feature}/root:$services.${foreignModel.name}Service.$crud`,
    ...config,
  };
}

function buildTransformer(
  transformer: TransformerConfig,
  model: ParsedModel,
  parsedProject: ParsedProjectConfig
): unknown {
  switch (transformer.type) {
    case 'embeddedRelation':
      return buildEmbeddedRelationTransformer(
        transformer,
        model,
        parsedProject
      );
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

function buildServiceForModel(
  model: ParsedModel,
  parsedProject: ParsedProjectConfig
): unknown {
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
            buildTransformer(transfomer, model, parsedProject)
          ),
          create: service.create?.fields?.length
            ? {
                prismaFields: service.create.fields,
                transformerNames: service.create.transformerNames,
              }
            : null,
          update: service.update?.fields?.length
            ? {
                prismaFields: service.update.fields,
                transformerNames: service.update.transformerNames,
              }
            : null,
          delete: service.delete?.disabled ? null : undefined,
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
  return models.map((model) =>
    buildServiceForModel(model, parsedProjectConfig)
  );
}
