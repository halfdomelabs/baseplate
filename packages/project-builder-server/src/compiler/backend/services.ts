import type {
  EmbeddedRelationTransformerConfig,
  ModelTransformerCompiler,
  ParsedModel,
  TransformerConfig,
} from '@halfdomelabs/project-builder-lib';

import {
  modelTransformerCompilerSpec,
  ModelUtils,
  undefinedIfEmpty,
} from '@halfdomelabs/project-builder-lib';

import { notEmpty } from '@src/utils/array.js';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

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

      return {
        generator: '@halfdomelabs/fastify/prisma/embedded-relation-transformer',
        name: foreignRelation.relation.foreignRelationName,
        embeddedFieldNames: definition.embeddedFieldNames.map((e) =>
          definitionContainer.nameFromId(e),
        ),
        embeddedTransformerNames: definition.embeddedTransformerNames?.map(
          (t) => definitionContainer.nameFromId(t),
        ),
        foreignModelName: definition.embeddedTransformerNames
          ? foreignModel.name
          : undefined,
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
): Record<string, unknown> | undefined {
  const { service } = model;
  if (!service) {
    return undefined;
  }

  return {
    name: `${model.name}Service`,
    id: `prisma-crud-service:${model.name}`,
    generator: '@halfdomelabs/fastify/core/service-file',
    methodOrder: ['create', 'update', 'delete'],
    children: {
      $crud: {
        generator: '@halfdomelabs/fastify/prisma/prisma-crud-service',
        modelName: model.name,
        children: {
          transformers: undefinedIfEmpty(
            service.transformers?.map((transfomer) =>
              buildTransformer(appBuilder, transfomer, model),
            ),
          ),
          create:
            service.create?.fields?.length && service.create.enabled
              ? {
                  prismaFields: service.create.fields.map((f) =>
                    appBuilder.nameFromId(f),
                  ),
                  transformerNames: undefinedIfEmpty(
                    service.create.transformerNames?.map((f) =>
                      appBuilder.nameFromId(f),
                    ),
                  ),
                }
              : null,
          update:
            service.update?.fields?.length && service.update.enabled
              ? {
                  prismaFields: service.update.fields.map((f) =>
                    appBuilder.nameFromId(f),
                  ),
                  transformerNames: undefinedIfEmpty(
                    service.update.transformerNames?.map((f) =>
                      appBuilder.nameFromId(f),
                    ),
                  ),
                }
              : null,
          delete: service.delete?.enabled ? {} : null,
        },
      },
    },
  };
}

export function buildServicesForFeature(
  appBuilder: BackendAppEntryBuilder,
  featureId: string,
): Record<string, unknown>[] {
  const models = ModelUtils.getModelsForFeature(
    appBuilder.projectDefinition,
    featureId,
  ).filter(
    (m) =>
      !!m.service?.create?.enabled ||
      !!m.service?.update?.enabled ||
      !!m.service?.delete?.enabled ||
      m.service?.transformers?.length,
  );
  return models
    .map((model) => buildServiceForModel(appBuilder, model))
    .filter(notEmpty);
}
