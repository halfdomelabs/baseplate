import { ParsedAppConfig } from '@src/parser';
import { ModelConfig } from '../../schema/models';

function buildQuerySchemaTypeForModel(model: ModelConfig): unknown {
  return {
    name: `${model.name}Queries`,
    generator: '@baseplate/fastify/nexus/nexus-types-file',
    children: {
      $objectType: {
        modelName: model.name,
        generator: '@baseplate/fastify/nexus/nexus-prisma-object',
        exposedFields: model.fields
          ?.filter((f) => f.exposed)
          .map((f) => f.name),
      },
      ...(!model.exposedQuery
        ? {}
        : {
            $findQuery: {
              modelName: model.name,
              generator: '@baseplate/fastify/nexus/nexus-prisma-find-query',
              children: {
                authorize: { roles: model.authorizeRead },
              },
            },
            $listQuery: {
              modelName: model.name,
              generator: '@baseplate/fastify/nexus/nexus-prisma-list-query',
              children: {
                authorize: { roles: model.authorizeRead },
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
  return {
    name: `${model.name}Mutations`,
    generator: '@baseplate/fastify/nexus/nexus-prisma-crud-file',
    modelName: model.name,
    crudServiceRef: `${feature}/root:$services.${model.name}Service`,
    children: {
      create: {
        children: { authorize: { roles: model.authorizeCreate } },
      },
      update: {
        children: { authorize: { roles: model.authorizeUpdate } },
      },
      delete: {
        children: { authorize: { roles: model.authorizeDelete } },
      },
    },
  };
}

export function buildSchemaTypesForFeature(
  feature: string,
  parsedApp: ParsedAppConfig
): unknown {
  const models =
    parsedApp
      .getModels()
      .filter(
        (m) =>
          m.feature === feature &&
          (m.exposedObjectType || m.exposedQuery || m.exposedMutations)
      ) || [];

  return models.flatMap((model) => [
    model.exposedObjectType || model.exposedQuery
      ? buildQuerySchemaTypeForModel(model)
      : null,
    model.exposedMutations
      ? buildMutationSchemaTypeForModel(feature, model)
      : null,
  ]);
}
