import { paramCase } from 'change-case';

import { ModelConfig } from '../../schema/models/index.js';
import { BackendAppEntryBuilder } from '../appEntryBuilder.js';
import { FeatureUtils } from '@src/definition/feature/feature-utils.js';
import { ModelUtils } from '@src/definition/index.js';
import { EnumConfig } from '@src/schema/models/enums.js';

function buildQuerySchemaTypeForModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): unknown[] {
  const { schema } = model ?? {};
  const {
    authorize,
    buildQuery,
    exposedFields = [],
    exposedForeignRelations = [],
    exposedLocalRelations = [],
  } = schema ?? {};

  return [
    {
      name: `${model.name}ObjectType`,
      fileName: `${paramCase(model.name)}.object-type`,
      generator: '@halfdomelabs/fastify/pothos/pothos-types-file',
      children: {
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
          fileName: `${paramCase(model.name)}.queries`,
          generator: '@halfdomelabs/fastify/pothos/pothos-prisma-query-file',
          modelName: model.name,
          children: {
            findQuery: {
              children: {
                authorize: {
                  roles: authorize?.read?.map((r) => appBuilder.nameFromId(r)),
                },
              },
            },
            listQuery: {
              children: {
                authorize: {
                  roles: authorize?.read?.map((r) => appBuilder.nameFromId(r)),
                },
              },
            },
          },
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
    appBuilder.projectConfig,
    featureId,
  );

  return {
    name: `${model.name}PothosMutations`,
    fileName: `${paramCase(model.name)}.mutations`,
    generator: '@halfdomelabs/fastify/pothos/pothos-prisma-crud-file',
    modelName: model.name,
    objectTypeRef: `${featurePath}/root:$schemaTypes.${model.name}ObjectType.$objectType`,
    crudServiceRef: `${featurePath}/root:$services.${model.name}Service`,
    children: {
      create: model.service?.create?.fields?.length
        ? {
            children: {
              authorize: {
                roles: authorize?.create?.map((r) => appBuilder.nameFromId(r)),
              },
            },
          }
        : null,
      update: {
        children: {
          authorize: {
            roles: authorize?.update?.map((r) => appBuilder.nameFromId(r)),
          },
        },
      },
      delete: {
        children: {
          authorize: {
            roles: authorize?.delete?.map((r) => appBuilder.nameFromId(r)),
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
    appBuilder.projectConfig,
    featureId,
  ).filter((m) => m.schema);
  const enums = appBuilder.parsedProject
    .getEnums()
    .filter((e) => e.feature === featureId && e.isExposed);

  return [
    ...models.flatMap((model) => [
      ...(model.schema?.buildObjectType ?? model.schema?.buildQuery
        ? buildQuerySchemaTypeForModel(appBuilder, model)
        : []),
      model.schema?.buildMutations
        ? buildMutationSchemaTypeForModel(appBuilder, model, featureId)
        : undefined,
    ]),
    ...buildEnumSchema(enums),
  ];
}
