import { ParsedProjectConfig } from '@src/parser';
import { ModelConfig } from '../../schema/models';

function buildQuerySchemaTypeForModel(model: ModelConfig): unknown {
  const { schema } = model || {};
  const {
    authorize,
    buildQuery,
    exposedFields = [],
    exposedForeignRelations = [],
    exposedLocalRelations = [],
  } = schema || {};

  return {
    name: `${model.name}Queries`,
    generator: '@baseplate/fastify/nexus/nexus-types-file',
    children: {
      $objectType: {
        modelName: model.name,
        generator: '@baseplate/fastify/nexus/nexus-prisma-object',
        exposedFields: [
          ...exposedFields,
          ...exposedForeignRelations,
          ...exposedLocalRelations,
        ],
      },
      ...(!buildQuery
        ? {}
        : {
            $findQuery: {
              modelName: model.name,
              generator: '@baseplate/fastify/nexus/nexus-prisma-find-query',
              children: {
                authorize: { roles: authorize?.read },
              },
            },
            $listQuery: {
              modelName: model.name,
              generator: '@baseplate/fastify/nexus/nexus-prisma-list-query',
              children: {
                authorize: { roles: authorize?.read },
              },
            },
          }),
    },
  };
}

function buildMutationSchemaTypeForModel(
  feature: string,
  model: ModelConfig
): unknown {
  const { schema: graphql } = model || {};
  const { authorize = {} } = graphql || {};

  return {
    name: `${model.name}Mutations`,
    generator: '@baseplate/fastify/nexus/nexus-prisma-crud-file',
    modelName: model.name,
    crudServiceRef: `${feature}/root:$services.${model.name}Service`,
    children: {
      create: {
        children: { authorize: { roles: authorize.create } },
      },
      update: {
        children: { authorize: { roles: authorize.create } },
      },
      delete: {
        children: { authorize: { roles: authorize.delete } },
      },
    },
  };
}

export function buildSchemaTypesForFeature(
  feature: string,
  parsedProject: ParsedProjectConfig
): unknown {
  const models =
    parsedProject
      .getModels()
      .filter((m) => m.feature === feature && m.schema) || [];

  return models.flatMap((model) => [
    model.schema?.buildObjectType || model.schema?.buildQuery
      ? buildQuerySchemaTypeForModel(model)
      : undefined,
    model.schema?.buildMutations
      ? buildMutationSchemaTypeForModel(feature, model)
      : undefined,
  ]);
}
