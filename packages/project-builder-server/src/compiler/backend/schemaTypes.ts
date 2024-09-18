import {
  EnumConfig,
  FeatureUtils,
  ModelConfig,
  ModelUtils,
  stripChildren,
} from '@halfdomelabs/project-builder-lib';
import { kebabCase } from 'change-case';

import { BackendAppEntryBuilder } from '../appEntryBuilder.js';
import { notEmpty } from '@src/utils/array.js';

function buildQuerySchemaTypeForModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): unknown[] {
  const { schema } = model ?? {};
  const {
    authorize,
    buildQuery,
    buildMutations,
    exposedFields = [],
    exposedForeignRelations = [],
    exposedLocalRelations = [],
  } = schema ?? {};

  return [
    {
      name: `${model.name}ObjectType`,
      fileName: `${kebabCase(model.name)}.object-type`,
      generator: '@halfdomelabs/fastify/pothos/pothos-types-file',
      children: {
        $primaryKey:
          (!!buildMutations || !!buildQuery) &&
          ModelUtils.getModelIdFields(model).length > 1
            ? {
                generator:
                  '@halfdomelabs/fastify/pothos/pothos-prisma-primary-key',
                modelName: model.name,
              }
            : undefined,
        $objectType: {
          generator: '@halfdomelabs/fastify/pothos/pothos-prisma-object',
          modelName: model.name,
          exposedFields: [
            ...exposedFields,
            ...exposedForeignRelations,
            ...exposedLocalRelations,
          ].map((id) => appBuilder.nameFromId(id)),
        },
      },
    },
    !buildQuery
      ? undefined
      : {
          name: `${model.name}PothosQueries`,
          fileName: `${kebabCase(model.name)}.queries`,
          generator: '@halfdomelabs/fastify/pothos/pothos-prisma-query-file',
          modelName: model.name,
          children: stripChildren({
            findQuery: {
              children: {
                authorize: !authorize?.read?.length
                  ? undefined
                  : {
                      roles: authorize?.read?.map((r) =>
                        appBuilder.nameFromId(r),
                      ),
                    },
              },
            },
            listQuery: {
              children: {
                authorize: !authorize?.read?.length
                  ? undefined
                  : {
                      roles: authorize?.read?.map((r) =>
                        appBuilder.nameFromId(r),
                      ),
                    },
              },
            },
          }),
        },
  ];
}

function buildMutationSchemaTypeForModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
  featureId: string,
): unknown {
  const { schema: graphql } = model ?? {};
  const { authorize } = graphql ?? {};

  const featurePath = FeatureUtils.getFeaturePathById(
    appBuilder.projectDefinition,
    featureId,
  );

  const isAuthEnabled = !!appBuilder.definitionContainer.definition.auth;

  const hasCreateRoles = !isAuthEnabled || !!authorize?.create?.length;
  const hasUpdateRoles = !isAuthEnabled || !!authorize?.update?.length;
  const hasDeleteRoles = !isAuthEnabled || !!authorize?.delete?.length;

  return {
    name: `${model.name}PothosMutations`,
    fileName: `${kebabCase(model.name)}.mutations`,
    generator: '@halfdomelabs/fastify/pothos/pothos-prisma-crud-file',
    modelName: model.name,
    objectTypeRef: `${featurePath}/root:$schemaTypes.${model.name}ObjectType.$objectType`,
    crudServiceRef: `${featurePath}/root:$services.${model.name}Service`,
    children: {
      create:
        !model.service?.create?.fields?.length || !hasCreateRoles
          ? undefined
          : {
              children: {
                authorize: {
                  roles: authorize?.create?.map((r) =>
                    appBuilder.nameFromId(r),
                  ),
                },
              },
            },
      update: !hasUpdateRoles
        ? undefined
        : {
            children: {
              authorize: !authorize?.update?.length
                ? undefined
                : {
                    roles: authorize?.update?.map((r) =>
                      appBuilder.nameFromId(r),
                    ),
                  },
            },
          },
      delete: !hasDeleteRoles
        ? undefined
        : {
            children: {
              authorize: !authorize?.delete?.length
                ? undefined
                : {
                    roles: authorize?.delete?.map((r) =>
                      appBuilder.nameFromId(r),
                    ),
                  },
            },
          },
    },
  };
}

function buildEnumSchema(enums: EnumConfig[]): unknown[] {
  if (!enums.length) {
    return [];
  }
  return [
    {
      name: `Enums`,
      generator: '@halfdomelabs/fastify/pothos/pothos-enums-file',
      children: {
        $enums: enums.map((enumConfig) => ({
          name: enumConfig.name,
          generator: '@halfdomelabs/fastify/pothos/pothos-prisma-enum',
          enumName: enumConfig.name,
        })),
      },
    },
  ];
}

export function buildSchemaTypesForFeature(
  appBuilder: BackendAppEntryBuilder,
  featureId: string,
): unknown {
  const models = ModelUtils.getModelsForFeature(
    appBuilder.projectDefinition,
    featureId,
  ).filter((m) => m.schema);
  const enums = appBuilder.parsedProject
    .getEnums()
    .filter((e) => e.feature === featureId && e.isExposed);

  return [
    ...models.flatMap((model) => [
      ...((model.schema?.buildObjectType ?? model.schema?.buildQuery)
        ? buildQuerySchemaTypeForModel(appBuilder, model)
        : []),
      model.schema?.buildMutations
        ? buildMutationSchemaTypeForModel(appBuilder, model, featureId)
        : undefined,
    ]),
    ...buildEnumSchema(enums),
  ].filter(notEmpty);
}
