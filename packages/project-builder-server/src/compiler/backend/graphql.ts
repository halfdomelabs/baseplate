import type {
  PothosPrismaCrudFileDescriptor,
  PothosPrismaEnumDescriptor,
  PothosPrismaFindQueryDescriptor,
  PothosPrismaListQueryDescriptor,
  PothosPrismaObjectDescriptor,
  PothosPrismaPrimaryKeyDescriptor,
  PothosTypesFileDescriptor,
} from '@halfdomelabs/fastify-generators';
import {
  EnumConfig,
  FeatureUtils,
  ModelConfig,
  ModelUtils,
  stripEmptyGeneratorChildren,
} from '@halfdomelabs/project-builder-lib';
import {
  DescriptorWithChildren,
  GeneratorDescriptor,
} from '@halfdomelabs/sync';
import { kebabCase } from 'change-case';

import { BackendAppEntryBuilder } from '../appEntryBuilder.js';
import { notEmpty } from '@src/utils/array.js';

function buildObjectTypeFile(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): PothosTypesFileDescriptor | undefined {
  const { graphql } = model ?? {};
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
  const { graphql } = model ?? {};
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
      $findQuery: {
        generator: '@halfdomelabs/fastify/pothos/pothos-prisma-get-query',
        modelName: model.name,
        children: {
          authorize:
            !isAuthEnabled || !get?.roles?.length
              ? undefined
              : {
                  roles: get?.roles?.map((r) => appBuilder.nameFromId(r)),
                },
        },
      } satisfies PothosPrismaFindQueryDescriptor,
      $listQuery: {
        generator: '@halfdomelabs/fastify/pothos/pothos-prisma-list-query',
        modelName: model.name,
        children: {
          authorize:
            !isAuthEnabled || !list?.roles?.length
              ? undefined
              : {
                  roles: list?.roles?.map((r) => appBuilder.nameFromId(r)),
                },
        },
      } satisfies PothosPrismaListQueryDescriptor,
    }),
  };
}

function buildMutationsFileForModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
  featureId: string,
): PothosPrismaCrudFileDescriptor | undefined {
  const { graphql } = model ?? {};
  const { mutations } = graphql ?? {};

  const buildMutations =
    !!mutations &&
    (!!mutations?.create?.enabled ||
      !!mutations?.update?.enabled ||
      !!mutations?.delete?.enabled);

  if (!buildMutations) {
    return undefined;
  }

  const featurePath = FeatureUtils.getFeaturePathById(
    appBuilder.projectDefinition,
    featureId,
  );

  const { create, update, delete: del } = mutations;

  const isAuthEnabled = !!appBuilder.definitionContainer.definition.auth;

  return {
    name: `${model.name}PothosMutations`,
    fileName: `${kebabCase(model.name)}.mutations`,
    generator: '@halfdomelabs/fastify/pothos/pothos-prisma-crud-file',
    modelName: model.name,
    objectTypeRef: `${featurePath}/root:$graphql.${model.name}ObjectType.$objectType`,
    crudServiceRef: `${featurePath}/root:$services.${model.name}Service`,
    children: {
      create: !create?.enabled
        ? undefined
        : {
            children: {
              authorize:
                isAuthEnabled && create.roles
                  ? {
                      roles: create.roles.map((r) => appBuilder.nameFromId(r)),
                    }
                  : undefined,
            },
          },
      update: !update?.enabled
        ? undefined
        : {
            children: {
              authorize:
                isAuthEnabled && update.roles
                  ? {
                      roles: update.roles.map((r) => appBuilder.nameFromId(r)),
                    }
                  : undefined,
            },
          },
      delete: !del?.enabled
        ? undefined
        : {
            children: {
              authorize:
                isAuthEnabled && del.roles
                  ? {
                      roles: del.roles.map((r) => appBuilder.nameFromId(r)),
                    }
                  : undefined,
            },
          },
    },
  };
}

function buildEnumFileForModel(
  enums: EnumConfig[],
): DescriptorWithChildren | undefined {
  if (!enums.length) {
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
      buildMutationsFileForModel(appBuilder, model, featureId),
    ]),
    buildEnumFileForModel(enums),
  ].filter(notEmpty);
}
