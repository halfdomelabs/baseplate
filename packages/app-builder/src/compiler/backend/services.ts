import { AppConfig } from '../../schema';
import { ModelConfig } from '../../schema/models';

function buildServiceForModel(model: ModelConfig): unknown {
  return {
    name: `${model.name}Service`,
    generator: '@baseplate/fastify/prisma/prisma-crud-service',
    modelName: model.name,
    children: {
      create: {
        options: {
          prismaFields: model.fields
            ?.filter((f) => f.creatable)
            .map((f) => f.name),
        },
      },
      update: {
        options: {
          prismaFields: model.fields
            ?.filter((f) => f.updatable)
            .map((f) => f.name),
        },
      },
    },
  };
}

export function buildServicesForFeature(
  feature: string,
  config: AppConfig
): unknown {
  const models =
    config.models?.filter((m) => m.feature === feature && m.generateService) ||
    [];
  return models.map(buildServiceForModel);
}
