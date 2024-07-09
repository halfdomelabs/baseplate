import {
  ModelTransformerCompiler,
  ModelUtils,
  modelTransformerCompilerSpec,
} from '@halfdomelabs/project-builder-lib';
import { ParsedModel } from '@halfdomelabs/project-builder-lib';
import {
  EmbeddedRelationTransformerConfig,
  TransformerConfig,
} from '@halfdomelabs/project-builder-lib';

import { BackendAppEntryBuilder } from '../appEntryBuilder.js';

export const embeddedRelationTransformerCompiler: ModelTransformerCompiler<EmbeddedRelationTransformerConfig> =
  {
    name: 'embeddedRelation',
    compileTransformer(definition, { definitionContainer, model }) {
      // find foreign relation
      const foreignRelation = ModelUtils.getRelationsToModel(
        definitionContainer.definition,
        model.id,
      ).find(
        ({ relation }) => relation.foreignId === definition.foreignRelationRef,
      );

      if (!foreignRelation) {
        throw new Error(
          `Could not find relation ${definition.foreignRelationRef} for embedded relation transformer`,
        );
      }

      const foreignModel = foreignRelation.model;

      const foreignModelFeature = definitionContainer.nameFromId(
        foreignModel.feature,
      );

      return {
        generator: '@halfdomelabs/fastify/prisma/embedded-relation-transformer',
        name: foreignRelation.relation.foreignRelationName,
        embeddedFieldNames: definition.embeddedFieldNames.map((e) =>
          definitionContainer.nameFromId(e),
        ),
        embeddedTransformerNames: definition.embeddedTransformerNames?.map(
          (t) => definitionContainer.nameFromId(t),
        ),
        foreignCrudServiceRef: !definition.embeddedTransformerNames
          ? undefined
          : `${foreignModelFeature}/root:$services.${foreignModel.name}Service.$crud`,
      };
    },
  };

const passwordTransformerCompiler: ModelTransformerCompiler = {
  name: 'password',
  compileTransformer() {
    return {
      name: 'password',
      generator: '@halfdomelabs/fastify/auth/prisma-password-transformer',
    };
  },
};

function buildTransformer(
  appBuilder: BackendAppEntryBuilder,
  transformer: TransformerConfig,
  model: ParsedModel,
): unknown {
  const { pluginStore } = appBuilder;
  const compilerImplementation = pluginStore.getPluginSpec(
    modelTransformerCompilerSpec,
  );

  const compiler = compilerImplementation.getModelTransformerCompiler(
    transformer.type,
    [embeddedRelationTransformerCompiler, passwordTransformerCompiler],
  );

  return compiler.compileTransformer(transformer, {
    definitionContainer: appBuilder.definitionContainer,
    model,
  });
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
    appBuilder.projectDefinition,
    featureId,
  ).filter((m) => m.service?.build);
  return models.map((model) => buildServiceForModel(appBuilder, model));
}
