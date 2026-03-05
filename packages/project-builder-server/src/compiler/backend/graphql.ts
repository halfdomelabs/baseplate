import type {
  EnumConfig,
  ModelConfig,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  pothosAuthorizeFieldGenerator,
  pothosEnumsFileGenerator,
  pothosPrismaCountQueryGenerator,
  pothosPrismaCrudMutationGenerator,
  pothosPrismaEnumGenerator,
  pothosPrismaFindQueryGenerator,
  pothosPrismaListQueryGenerator,
  pothosPrismaObjectGenerator,
  pothosPrismaPrimaryKeyGenerator,
  pothosTypesFileGenerator,
} from '@baseplate-dev/fastify-generators';
import { authConfigSpec, ModelUtils } from '@baseplate-dev/project-builder-lib';
import { notEmpty, uppercaseFirstChar } from '@baseplate-dev/utils';
import { kebabCase } from 'change-case';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

function buildObjectTypeFile(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): GeneratorBundle | undefined {
  const { graphql } = model;
  const { objectType, mutations, queries } = graphql;

  const buildQuery = queries.get.enabled || queries.list.enabled;
  const buildMutations =
    mutations.create.enabled ||
    mutations.update.enabled ||
    mutations.delete.enabled;

  if (!objectType.enabled) {
    return undefined;
  }

  const { fields, localRelations, foreignRelations } = objectType;

  const authConfig =
    appBuilder.definitionContainer.pluginStore.use(authConfigSpec);
  const isAuthEnabled = !!authConfig.getAuthConfig(
    appBuilder.projectDefinition,
  );

  return pothosTypesFileGenerator({
    id: `${model.id}-object-type`,
    fileName: `${kebabCase(model.name)}.object-type`,
    children: {
      primaryKey:
        (buildMutations || buildQuery) &&
        ModelUtils.getModelIdFields(model).length > 1
          ? pothosPrismaPrimaryKeyGenerator({
              modelName: model.name,
              order: 0,
            })
          : undefined,
      objectType: pothosPrismaObjectGenerator({
        modelName: model.name,
        exposedFields: [...fields, ...foreignRelations, ...localRelations].map(
          (entry) => ({
            name: appBuilder.nameFromId(entry.ref),
            globalRoles: isAuthEnabled
              ? entry.globalRoles.map((r) => appBuilder.nameFromId(r))
              : [],
            instanceRoles: isAuthEnabled
              ? entry.instanceRoles.map((r) => appBuilder.nameFromId(r))
              : [],
          }),
        ),
        order: 1,
      }),
    },
  });
}

function buildQueriesFileForModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): GeneratorBundle | undefined {
  const { graphql } = model;
  const { queries } = graphql;

  if (!queries.get.enabled && !queries.list.enabled) {
    return undefined;
  }

  const { get, list } = queries;

  const authConfig =
    appBuilder.definitionContainer.pluginStore.use(authConfigSpec);

  const isAuthEnabled = !!authConfig.getAuthConfig(
    appBuilder.projectDefinition,
  );

  return pothosTypesFileGenerator({
    id: `${model.id}-queries`,
    fileName: `${kebabCase(model.name)}.queries`,
    children: {
      findQuery: get.enabled
        ? pothosPrismaFindQueryGenerator({
            order: 0,
            modelName: model.name,
            hasPrimaryKeyInputType:
              ModelUtils.getModelIdFields(model).length > 1,
            children: {
              authorize:
                !isAuthEnabled || get.roles.length === 0
                  ? undefined
                  : pothosAuthorizeFieldGenerator({
                      roles: get.roles.map((r) => appBuilder.nameFromId(r)),
                    }),
            },
          })
        : undefined,
      listQuery: list.enabled
        ? pothosPrismaListQueryGenerator({
            order: 1,
            modelName: model.name,
            children: {
              authorize:
                !isAuthEnabled || list.roles.length === 0
                  ? undefined
                  : pothosAuthorizeFieldGenerator({
                      roles: list.roles.map((r) => appBuilder.nameFromId(r)),
                    }),
            },
          })
        : undefined,
      countQuery:
        list.enabled && list.count.enabled
          ? pothosPrismaCountQueryGenerator({
              order: 2,
              modelName: model.name,
              children: {
                authorize:
                  !isAuthEnabled || list.roles.length === 0
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

/**
 * Derives the GraphQL mutation authorize config from service-level roles.
 * - No roles → no auth (public)
 * - Only global roles → pass those roles directly
 * - Instance roles present → use all auth roles as coarse gate
 *   (any authenticated user can call, service handles fine-grained auth)
 */
function deriveMutationAuthorize(
  appBuilder: BackendAppEntryBuilder,
  serviceMethod: {
    globalRoles: string[];
    instanceRoles?: string[];
  },
  isAuthEnabled: boolean,
): GeneratorBundle | undefined {
  if (!isAuthEnabled) {
    return undefined;
  }

  const { globalRoles, instanceRoles = [] } = serviceMethod;

  if (globalRoles.length === 0 && instanceRoles.length === 0) {
    return undefined;
  }

  if (instanceRoles.length > 0) {
    // Instance roles present → coarse gate with all auth roles
    const authConfig =
      appBuilder.definitionContainer.pluginStore.use(authConfigSpec);
    const allRoles =
      authConfig.getAuthConfig(appBuilder.projectDefinition)?.roles ?? [];
    if (allRoles.length === 0) {
      return undefined;
    }
    return pothosAuthorizeFieldGenerator({
      roles: allRoles.map((r) => r.name),
    });
  }

  // Only global roles → pass them through
  return pothosAuthorizeFieldGenerator({
    roles: globalRoles.map((r) => appBuilder.nameFromId(r)),
  });
}

function buildMutationsFileForModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): GeneratorBundle | undefined {
  const { graphql, service } = model;
  const { mutations } = graphql;

  const buildMutations =
    mutations.create.enabled ||
    mutations.update.enabled ||
    mutations.delete.enabled;

  if (!buildMutations) {
    return undefined;
  }

  const { create, update, delete: del } = mutations;

  const authConfig =
    appBuilder.definitionContainer.pluginStore.use(authConfigSpec);

  const isAuthEnabled = !!authConfig.getAuthConfig(
    appBuilder.projectDefinition,
  );

  const sharedMutationConfig = {
    modelName: model.name,
    crudServiceRef: `prisma-data-service:${model.name}`,
  };

  return pothosTypesFileGenerator({
    id: `${model.id}-mutations`,
    fileName: `${kebabCase(model.name)}.mutations`,
    children: {
      create: create.enabled
        ? pothosPrismaCrudMutationGenerator({
            ...sharedMutationConfig,
            order: 0,
            name: `create${uppercaseFirstChar(model.name)}`,
            children: {
              authorize: deriveMutationAuthorize(
                appBuilder,
                service.create,
                isAuthEnabled,
              ),
            },
          })
        : undefined,
      update: update.enabled
        ? pothosPrismaCrudMutationGenerator({
            ...sharedMutationConfig,
            order: 1,
            name: `update${uppercaseFirstChar(model.name)}`,
            children: {
              authorize: deriveMutationAuthorize(
                appBuilder,
                service.update,
                isAuthEnabled,
              ),
            },
          })
        : undefined,
      delete: del.enabled
        ? pothosPrismaCrudMutationGenerator({
            ...sharedMutationConfig,
            order: 2,
            name: `delete${uppercaseFirstChar(model.name)}`,
            children: {
              authorize: deriveMutationAuthorize(
                appBuilder,
                service.delete,
                isAuthEnabled,
              ),
            },
          })
        : undefined,
    },
  });
}

function buildEnumFileForModel(
  enumFileId: string,
  enums: EnumConfig[],
): GeneratorBundle | undefined {
  if (enums.length === 0) {
    return undefined;
  }
  return pothosEnumsFileGenerator({
    id: enumFileId,
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
  );

  const enums = (appBuilder.projectDefinition.enums ?? []).filter(
    (e) => e.featureRef === featureId && e.isExposed,
  );

  return [
    ...models.flatMap((model) => [
      buildObjectTypeFile(appBuilder, model),
      buildQueriesFileForModel(appBuilder, model),
      buildMutationsFileForModel(appBuilder, model),
    ]),
    buildEnumFileForModel(`${featureId}-enums`, enums),
  ].filter(notEmpty);
}
