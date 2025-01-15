import type {
  EnumConfig,
  ModelConfig,
} from '@halfdomelabs/project-builder-lib';
import type { GeneratorBundle } from '@halfdomelabs/sync';

import {
  pothosAuthorizeFieldGenerator,
  pothosEnumsFileGenerator,
  pothosPrismaCrudMutationGenerator,
  pothosPrismaEnumGenerator,
  pothosPrismaFindQueryGenerator,
  pothosPrismaListQueryGenerator,
  pothosPrismaObjectGenerator,
  pothosPrismaPrimaryKeyGenerator,
  pothosTypesFileGenerator,
} from '@halfdomelabs/fastify-generators';
import { ModelUtils } from '@halfdomelabs/project-builder-lib';
import { kebabCase } from 'change-case';

import { notEmpty } from '@src/utils/array.js';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

function buildObjectTypeFile(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): GeneratorBundle | undefined {
  const { graphql } = model;
  const { objectType, mutations, queries } = graphql ?? {};

  const buildQuery = queries?.get?.enabled ?? queries?.list?.enabled;
  const buildMutations =
    mutations?.create?.enabled ??
    mutations?.update?.enabled ??
    mutations?.delete?.enabled;

  if (!objectType?.enabled) {
    return undefined;
  }

  const { fields, localRelations = [], foreignRelations = [] } = objectType;

  return pothosTypesFileGenerator({
    fileName: `${kebabCase(model.name)}.object-type`,
    children: {
      primaryKey:
        (!!buildMutations || !!buildQuery) &&
        ModelUtils.getModelIdFields(model).length > 1
          ? pothosPrismaPrimaryKeyGenerator({
              modelName: model.name,
            })
          : undefined,
      objectType: pothosPrismaObjectGenerator({
        modelName: model.name,
        exposedFields: [...fields, ...foreignRelations, ...localRelations].map(
          (id) => appBuilder.nameFromId(id),
        ),
      }),
    },
  });
}

function buildQueriesFileForModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): GeneratorBundle | undefined {
  const { graphql } = model;
  const { queries } = graphql ?? {};

  if (!queries?.get?.enabled && !queries?.list?.enabled) {
    return undefined;
  }

  const { get, list } = queries;

  const isAuthEnabled = !!appBuilder.definitionContainer.definition.auth;

  return pothosTypesFileGenerator({
    fileName: `${kebabCase(model.name)}.queries`,
    categoryOrder: ['find-query', 'list-query'],
    children: {
      findQuery: get?.enabled
        ? pothosPrismaFindQueryGenerator({
            modelName: model.name,
            children: {
              authorize:
                !isAuthEnabled || !get.roles?.length
                  ? undefined
                  : pothosAuthorizeFieldGenerator({
                      roles: get.roles.map((r) => appBuilder.nameFromId(r)),
                    }),
            },
          })
        : undefined,
      listQuery: list?.enabled
        ? pothosPrismaListQueryGenerator({
            modelName: model.name,
            children: {
              authorize:
                !isAuthEnabled || !list.roles?.length
                  ? undefined
                  : pothosAuthorizeFieldGenerator({
                      roles: list.roles.map((r) => appBuilder.nameFromId(r)),
                    }),
            },
          })
        : undefined,
    },
  });
}

function buildMutationsFileForModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): GeneratorBundle | undefined {
  const { graphql } = model;
  const { mutations } = graphql ?? {};

  const buildMutations =
    !!mutations &&
    (!!mutations.create?.enabled ||
      !!mutations.update?.enabled ||
      !!mutations.delete?.enabled);

  if (!buildMutations) {
    return undefined;
  }

  const { create, update, delete: del } = mutations;

  const isAuthEnabled = !!appBuilder.definitionContainer.definition.auth;

  const sharedMutationConfig = {
    modelName: model.name,
    crudServiceRef: `prisma-crud-service:${model.name}`,
  };

  return pothosTypesFileGenerator({
    fileName: `${kebabCase(model.name)}.mutations`,
    children: {
      create: create?.enabled
        ? pothosPrismaCrudMutationGenerator({
            ...sharedMutationConfig,
            type: 'create',
            children: {
              authorize:
                isAuthEnabled && create.roles
                  ? pothosAuthorizeFieldGenerator({
                      roles: create.roles.map((r) => appBuilder.nameFromId(r)),
                    })
                  : undefined,
            },
          })
        : undefined,
      update: update?.enabled
        ? pothosPrismaCrudMutationGenerator({
            ...sharedMutationConfig,
            type: 'update',
            children: {
              authorize:
                isAuthEnabled && update.roles
                  ? pothosAuthorizeFieldGenerator({
                      roles: update.roles.map((r) => appBuilder.nameFromId(r)),
                    })
                  : undefined,
            },
          })
        : undefined,
      delete: del?.enabled
        ? pothosPrismaCrudMutationGenerator({
            ...sharedMutationConfig,
            type: 'delete',
            children: {
              authorize:
                isAuthEnabled && del.roles
                  ? pothosAuthorizeFieldGenerator({
                      roles: del.roles.map((r) => appBuilder.nameFromId(r)),
                    })
                  : undefined,
            },
          })
        : undefined,
    },
  });
}

function buildEnumFileForModel(
  enums: EnumConfig[],
): GeneratorBundle | undefined {
  if (enums.length === 0) {
    return undefined;
  }
  return pothosEnumsFileGenerator({
    name: `Enums`,
    children: {
      enums: enums.map((enumConfig) =>
        pothosPrismaEnumGenerator({
          enumName: enumConfig.name,
        }),
      ),
    },
  });
}

export function buildGraphqlForFeature(
  appBuilder: BackendAppEntryBuilder,
  featureId: string,
): GeneratorBundle[] {
  const models = ModelUtils.getModelsForFeature(
    appBuilder.projectDefinition,
    featureId,
  ).filter((m) => m.graphql);

  const enums =
    appBuilder.projectDefinition.enums?.filter(
      (e) => e.featureRef === featureId && e.isExposed,
    ) ?? [];

  return [
    ...models.flatMap((model) => [
      buildObjectTypeFile(appBuilder, model),
      buildQueriesFileForModel(appBuilder, model),
      buildMutationsFileForModel(appBuilder, model),
    ]),
    buildEnumFileForModel(enums),
  ].filter(notEmpty);
}
