import { BackendAppEntryBuilder } from '../appEntryBuilder.js';
import { ModelUtils } from '@src/definition/index.js';
import { ParsedModel } from '@src/parser/types.js';
import {
  EmbeddedRelationTransformerConfig,
  FileTransformerConfig,
  TransformerConfig,
} from '@src/schema/models/transformers.js';

function buildEmbeddedRelationTransformer(
  appBuilder: BackendAppEntryBuilder,
  transformer: EmbeddedRelationTransformerConfig,
  model: ParsedModel,
): unknown {
  const { type, ...config } = transformer;

  // find foreign relation
  const foreignRelation = ModelUtils.getRelationsToModel(
    appBuilder.projectConfig,
    model.id,
  ).find(
    ({ relation }) => relation.foreignId === transformer.foreignRelationRef,
  );

  if (!foreignRelation) {
    throw new Error(
      `Could not find relation ${transformer.name} for embedded relation transformer`,
    );
  }

  const foreignModel = foreignRelation.model;

  const foreignModelFeature = appBuilder.nameFromId(foreignModel.feature);

  return {
    generator: '@halfdomelabs/fastify/prisma/embedded-relation-transformer',
    name: foreignRelation.relation.foreignRelationName,
    embeddedFieldNames: config.embeddedFieldNames.map((e) =>
      appBuilder.nameFromId(e),
    ),
    embeddedTransformerNames: config.embeddedTransformerNames?.map((t) =>
      appBuilder.nameFromId(t),
    ),
    foreignCrudServiceRef: !transformer.embeddedTransformerNames
      ? undefined
      : `${foreignModelFeature}/root:$services.${foreignModel.name}Service.$crud`,
  };
}

function buildFileTransformer(
  appBuilder: BackendAppEntryBuilder,
  transformer: FileTransformerConfig,
  model: ParsedModel,
): unknown {
  const { fileRelationRef } = transformer;

  const foreignRelation = model.model.relations?.find(
    (relation) => relation.id === fileRelationRef,
  );

  if (!foreignRelation) {
    throw new Error(
      `Could not find relation ${fileRelationRef} for file transformer`,
    );
  }

  const category = appBuilder.projectConfig.storage?.categories.find(
    (c) => c.usedByRelation === foreignRelation.foreignId,
  );

  if (!category) {
    throw new Error(
      `Could not find category for relation ${foreignRelation.name}`,
    );
  }

  return {
    generator: '@halfdomelabs/fastify/storage/prisma-file-transformer',
    category: category.name,
    name: foreignRelation.name,
  };
}

function buildTransformer(
  appBuilder: BackendAppEntryBuilder,
  transformer: TransformerConfig,
  model: ParsedModel,
): unknown {
  switch (transformer.type) {
    case 'embeddedRelation':
      return buildEmbeddedRelationTransformer(appBuilder, transformer, model);
    case 'password':
      return {
        name: transformer.name,
        generator: '@halfdomelabs/fastify/auth/prisma-password-transformer',
      };
    case 'file':
      return buildFileTransformer(appBuilder, transformer, model);
    default:
      throw new Error(
        `Unknown transformer type: ${(transformer as { type: string }).type}`,
      );
  }
}

function buildServiceForModel(
  appBuilder: BackendAppEntryBuilder,
  model: ParsedModel,
): unknown {
  const { service } = model;
  if (!service) {
    return undefined;
  }

  return {
    name: `${model.name}Service`,
    generator: '@halfdomelabs/fastify/core/service-file',
    methodOrder: ['create', 'update', 'delete'],
    children: {
      $crud: {
        generator: '@halfdomelabs/fastify/prisma/prisma-crud-service',
        modelName: model.name,
        children: {
          transformers: service.transformers?.map((transfomer) =>
            buildTransformer(appBuilder, transfomer, model),
          ),
          create: service.create?.fields?.length
            ? {
                prismaFields: service.create.fields.map((f) =>
                  appBuilder.nameFromId(f),
                ),
                transformerNames: service.create.transformerNames?.map((f) =>
                  appBuilder.nameFromId(f),
                ),
              }
            : null,
          update: service.update?.fields?.length
            ? {
                prismaFields: service.update.fields.map((f) =>
                  appBuilder.nameFromId(f),
                ),
                transformerNames: service.update.transformerNames?.map((f) =>
                  appBuilder.nameFromId(f),
                ),
              }
            : null,
          delete: service.delete?.disabled ? null : undefined,
        },
      },
    },
  };
}

export function buildServicesForFeature(
  appBuilder: BackendAppEntryBuilder,
  featureId: string,
): unknown {
  const models = ModelUtils.getModelsForFeature(
    appBuilder.projectConfig,
    featureId,
  ).filter((m) => m.service?.build);
  return models.map((model) => buildServiceForModel(appBuilder, model));
}
