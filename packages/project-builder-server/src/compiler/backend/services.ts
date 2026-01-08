import type {
  ModelConfig,
  TransformerConfig,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  prismaDataCreateGenerator,
  prismaDataDeleteGenerator,
  prismaDataServiceGenerator,
  prismaDataUpdateGenerator,
  serviceFileGenerator,
} from '@baseplate-dev/fastify-generators';
import {
  modelTransformerCompilerSpec,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';
import { notEmpty, uppercaseFirstChar } from '@baseplate-dev/utils';
import { kebabCase } from 'change-case';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

function buildVirtualInputField(
  appBuilder: BackendAppEntryBuilder,
  transformer: TransformerConfig,
  model: ModelConfig,
): GeneratorBundle | undefined {
  const { pluginStore } = appBuilder;
  const compilerImplementation = pluginStore.getPluginSpec(
    modelTransformerCompilerSpec,
  );

  const compiler = compilerImplementation.transformers.get(transformer.type);

  if (!compiler) {
    throw new Error(
      `Compiler for transformer type ${transformer.type} not found`,
    );
  }

  return compiler.compileField(transformer, {
    definitionContainer: appBuilder.definitionContainer,
    model,
  });
}

function buildDataServiceForModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): GeneratorBundle | undefined {
  if (!ModelUtils.hasService(model)) {
    return undefined;
  }

  const createFields = model.service.create.enabled
    ? (model.service.create.fields?.map((f) => appBuilder.nameFromId(f)) ?? [])
    : [];
  const updateFields = model.service.update.enabled
    ? (model.service.update.fields?.map((f) => appBuilder.nameFromId(f)) ?? [])
    : [];
  const allFields = [...new Set([...createFields, ...updateFields])];

  return serviceFileGenerator({
    name: `${model.name}DataService`,
    id: `prisma-data-service:${model.name}`,
    fileName: `${kebabCase(model.name)}.data-service`,
    children: {
      $data: prismaDataServiceGenerator({
        modelName: model.name,
        modelFieldNames: allFields,
        children: {
          $fields: model.service.transformers
            .map((transfomer) =>
              buildVirtualInputField(appBuilder, transfomer, model),
            )
            .filter(notEmpty),
          $create:
            createFields.length > 0
              ? prismaDataCreateGenerator({
                  name: `create${uppercaseFirstChar(model.name)}`,
                  modelName: model.name,
                  fields: [
                    ...createFields,
                    ...(model.service.create.transformerNames?.map((t) =>
                      appBuilder.nameFromId(t),
                    ) ?? []),
                  ],
                })
              : undefined,
          $update:
            updateFields.length > 0
              ? prismaDataUpdateGenerator({
                  name: `update${uppercaseFirstChar(model.name)}`,
                  modelName: model.name,
                  fields: [
                    ...updateFields,
                    ...(model.service.update.transformerNames?.map((t) =>
                      appBuilder.nameFromId(t),
                    ) ?? []),
                  ],
                })
              : undefined,
          $delete: model.service.delete.enabled
            ? prismaDataDeleteGenerator({
                name: `delete${uppercaseFirstChar(model.name)}`,
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
      !!m.service.create.enabled ||
      !!m.service.update.enabled ||
      !!m.service.delete.enabled ||
      m.service.transformers.length > 0,
  );
  return models
    .map((model) => buildDataServiceForModel(appBuilder, model))
    .filter(notEmpty);
}
