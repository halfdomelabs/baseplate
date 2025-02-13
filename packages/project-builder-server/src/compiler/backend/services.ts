import type {
  EmbeddedRelationTransformerConfig,
  ModelConfig,
  ModelTransformerCompiler,
  TransformerConfig,
} from '@halfdomelabs/project-builder-lib';
import type { GeneratorBundle } from '@halfdomelabs/sync';

import {
  embeddedRelationTransformerGenerator,
  prismaCrudCreateGenerator,
  prismaCrudDeleteGenerator,
  prismaCrudServiceGenerator,
  prismaCrudUpdateGenerator,
  prismaPasswordTransformerGenerator,
  serviceFileGenerator,
} from '@halfdomelabs/fastify-generators';
import {
  modelTransformerCompilerSpec,
  ModelUtils,
  undefinedIfEmpty,
} from '@halfdomelabs/project-builder-lib';

import { notEmpty } from '@src/utils/array.js';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

const embeddedRelationTransformerCompiler: ModelTransformerCompiler<EmbeddedRelationTransformerConfig> =
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

      return embeddedRelationTransformerGenerator({
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
      });
    },
  };

const passwordTransformerCompiler: ModelTransformerCompiler = {
  name: 'password',
  compileTransformer() {
    return prismaPasswordTransformerGenerator({});
  },
};

function buildTransformer(
  appBuilder: BackendAppEntryBuilder,
  transformer: TransformerConfig,
  model: ModelConfig,
): GeneratorBundle {
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
  model: ModelConfig,
): GeneratorBundle | undefined {
  const { service } = model;
  if (!service) {
    return undefined;
  }

  return serviceFileGenerator({
    name: `${model.name}Service`,
    id: `prisma-crud-service:${model.name}`,
    methodOrder: ['create', 'update', 'delete'],
    children: {
      $crud: prismaCrudServiceGenerator({
        modelName: model.name,
        children: {
          transformers: service.transformers?.map((transfomer) =>
            buildTransformer(appBuilder, transfomer, model),
          ),
          create:
            service.create?.fields?.length && service.create.enabled
              ? prismaCrudCreateGenerator({
                  name: 'create',
                  modelName: model.name,
                  prismaFields: service.create.fields.map((f) =>
                    appBuilder.nameFromId(f),
                  ),
                  transformerNames: undefinedIfEmpty(
                    service.create.transformerNames?.map((f) =>
                      appBuilder.nameFromId(f),
                    ),
                  ),
                })
              : undefined,
          update:
            service.update?.fields?.length && service.update.enabled
              ? prismaCrudUpdateGenerator({
                  name: 'update',
                  modelName: model.name,
                  prismaFields: service.update.fields.map((f) =>
                    appBuilder.nameFromId(f),
                  ),
                  transformerNames: undefinedIfEmpty(
                    service.update.transformerNames?.map((f) =>
                      appBuilder.nameFromId(f),
                    ),
                  ),
                })
              : undefined,
          delete: service.delete?.enabled
            ? prismaCrudDeleteGenerator({
                name: 'delete',
                modelName: model.name,
              })
            : undefined,
        },
      }),
    },
  });
}

export function buildServicesForFeature(
  appBuilder: BackendAppEntryBuilder,
  featureId: string,
): GeneratorBundle[] {
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
