import { AppConfig } from '../../schema';
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
      $findQuery: {
        modelName: model.name,
        generator: '@baseplate/fastify/nexus/nexus-prisma-find-query',
      },
      $listQuery: {
        modelName: model.name,
        generator: '@baseplate/fastify/nexus/nexus-prisma-list-query',
      },
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
  };
}

export function buildSchemaTypesForFeature(
  feature: string,
  config: AppConfig
): unknown {
  const models =
    config.models?.filter(
      (m) => m.feature === feature && (m.exposedQuery || m.exposedMutations)
    ) || [];

  return models.flatMap((model) => [
    model.exposedQuery ? buildQuerySchemaTypeForModel(model) : null,
    model.exposedMutations
      ? buildMutationSchemaTypeForModel(feature, model)
      : null,
  ]);
}
