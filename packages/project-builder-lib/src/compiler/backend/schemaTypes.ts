import { paramCase } from 'change-case';

import { ModelConfig } from '../../schema/models/index.js';
import { FeatureUtils } from '@src/definition/feature/feature-utils.js';
import { ParsedProjectConfig } from '@src/parser/index.js';
import { EnumConfig } from '@src/schema/models/enums.js';

function buildQuerySchemaTypeForModel(model: ModelConfig): unknown[] {
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
          ],
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
                authorize: { roles: authorize?.read },
              },
            },
            listQuery: {
              children: {
                authorize: { roles: authorize?.read },
              },
            },
          },
        },
  ];
}

function buildMutationSchemaTypeForModel(
  featurePath: string,
  model: ModelConfig,
): unknown {
  const { schema: graphql } = model ?? {};
  const { authorize } = graphql ?? {};

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
            children: { authorize: { roles: authorize?.create } },
          }
        : null,
      update: {
        children: { authorize: { roles: authorize?.update } },
      },
      delete: {
        children: { authorize: { roles: authorize?.delete } },
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
  featureId: string,
  parsedProject: ParsedProjectConfig,
): unknown {
  const models =
    parsedProject
      .getModels()
      .filter((m) => m.feature === featureId && m.schema) ?? [];
  const enums = parsedProject
    .getEnums()
    .filter((e) => e.feature === featureId && e.isExposed);

  const featurePath = FeatureUtils.getFeatureByIdOrThrow(
    parsedProject.projectConfig,
    featureId,
  ).name;

  return [
    ...models.flatMap((model) => [
      ...(model.schema?.buildObjectType ?? model.schema?.buildQuery
        ? buildQuerySchemaTypeForModel(model)
        : []),
      model.schema?.buildMutations
        ? buildMutationSchemaTypeForModel(featurePath, model)
        : undefined,
    ]),
    ...buildEnumSchema(enums),
  ];
}
