import type {
  EnumConfig,
  ModelConfig,
} from '@halfdomelabs/project-builder-lib';
import type {
  DescriptorWithChildren,
  GeneratorDescriptor,
} from '@halfdomelabs/sync';

import {
  type PothosPrismaCrudFileDescriptor,
  type PothosPrismaEnumDescriptor,
  type PothosPrismaFindQueryDescriptor,
  type PothosPrismaListQueryDescriptor,
  type PothosPrismaObjectDescriptor,
  type PothosPrismaPrimaryKeyDescriptor,
  type PothosTypesFileDescriptor,
} from '@halfdomelabs/fastify-generators';
import {
  ModelUtils,
  stripEmptyGeneratorChildren,
} from '@halfdomelabs/project-builder-lib';
import { kebabCase } from 'change-case';

import { notEmpty } from '@src/utils/array.js';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

function buildObjectTypeFile(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): PothosTypesFileDescriptor | undefined {
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

  return {
    name: `${model.name}ObjectType`,
    fileName: `${kebabCase(model.name)}.object-type`,
    generator: '@halfdomelabs/fastify/pothos/pothos-types-file',
    children: {
      $primaryKey:
        (!!buildMutations || !!buildQuery) &&
        ModelUtils.getModelIdFields(model).length > 1
          ? ({
              generator:
                '@halfdomelabs/fastify/pothos/pothos-prisma-primary-key',
              modelName: model.name,
            } satisfies PothosPrismaPrimaryKeyDescriptor)
          : undefined,
      $objectType: {
        generator: '@halfdomelabs/fastify/pothos/pothos-prisma-object',
        modelName: model.name,
        exposedFields: [...fields, ...foreignRelations, ...localRelations].map(
          (id) => appBuilder.nameFromId(id),
        ),
      } satisfies PothosPrismaObjectDescriptor,
    },
  };
}

function buildQueriesFileForModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): PothosTypesFileDescriptor | undefined {
  const { graphql } = model;
  const { queries } = graphql ?? {};

  if (!queries?.get?.enabled && !queries?.list?.enabled) {
    return undefined;
  }

  const { get, list } = queries;

  const isAuthEnabled = !!appBuilder.definitionContainer.definition.auth;

  return {
    name: `${model.name}PothosQueries`,
    fileName: `${kebabCase(model.name)}.queries`,
    generator: '@halfdomelabs/fastify/pothos/pothos-types-file',
    categoryOrder: ['find-query', 'list-query'],
    children: stripEmptyGeneratorChildren({
      $findQuery: get?.enabled
        ? ({
            generator: '@halfdomelabs/fastify/pothos/pothos-prisma-get-query',
            modelName: model.name,
            children: {
              authorize:
                !isAuthEnabled || !get.roles?.length
                  ? undefined
                  : {
                      roles: get.roles.map((r) => appBuilder.nameFromId(r)),
                    },
            },
          } satisfies PothosPrismaFindQueryDescriptor)
        : undefined,
      $listQuery: list?.enabled
        ? ({
            generator: '@halfdomelabs/fastify/pothos/pothos-prisma-list-query',
            modelName: model.name,
            children: {
              authorize:
                !isAuthEnabled || !list.roles?.length
                  ? undefined
                  : {
                      roles: list.roles.map((r) => appBuilder.nameFromId(r)),
                    },
            },
          } satisfies PothosPrismaListQueryDescriptor)
        : undefined,
    }),
  };
}

function buildMutationsFileForModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): PothosPrismaCrudFileDescriptor | undefined {
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

  return {
    name: `${model.name}PothosMutations`,
    fileName: `${kebabCase(model.name)}.mutations`,
    generator: '@halfdomelabs/fastify/pothos/pothos-prisma-crud-file',
    modelName: model.name,
    crudServiceRef: `prisma-crud-service:${model.name}`,
    children: {
      create: create?.enabled
        ? {
            children: {
              authorize:
                isAuthEnabled && create.roles
                  ? {
                      roles: create.roles.map((r) => appBuilder.nameFromId(r)),
                    }
                  : undefined,
            },
          }
        : undefined,
      update: update?.enabled
        ? {
            children: {
              authorize:
                isAuthEnabled && update.roles
                  ? {
                      roles: update.roles.map((r) => appBuilder.nameFromId(r)),
                    }
                  : undefined,
            },
          }
        : undefined,
      delete: del?.enabled
        ? {
            children: {
              authorize:
                isAuthEnabled && del.roles
                  ? {
                      roles: del.roles.map((r) => appBuilder.nameFromId(r)),
                    }
                  : undefined,
            },
          }
        : undefined,
    },
  };
}

function buildEnumFileForModel(
  enums: EnumConfig[],
): DescriptorWithChildren | undefined {
  if (enums.length === 0) {
    return undefined;
  }
  return {
    name: `Enums`,
    generator: '@halfdomelabs/fastify/pothos/pothos-enums-file',
    children: {
      $enums: enums.map(
        (enumConfig): PothosPrismaEnumDescriptor => ({
          name: enumConfig.name,
          generator: '@halfdomelabs/fastify/pothos/pothos-prisma-enum',
          enumName: enumConfig.name,
        }),
      ),
    },
  };
}

export function buildGraphqlForFeature(
  appBuilder: BackendAppEntryBuilder,
  featureId: string,
): GeneratorDescriptor[] {
  const models = ModelUtils.getModelsForFeature(
    appBuilder.projectDefinition,
    featureId,
  ).filter((m) => m.graphql);

  const enums =
    appBuilder.projectDefinition.enums?.filter(
      (e) => e.feature === featureId && e.isExposed,
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
