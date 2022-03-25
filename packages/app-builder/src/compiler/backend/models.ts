import { AppConfig } from '../../schema';
import { ModelConfig, ModelFieldConfig } from '../../schema/models';

function buildField(field: ModelFieldConfig): unknown {
  return {
    name: field.name,
    type: field.type,
    id: field.id,
    options: field.genUuid ? { autoGenerate: true } : {},
    optional: field.optional,
    unique: field.unique,
  };
}

function buildModel(model: ModelConfig): unknown {
  return {
    name: model.name,
    generator: '@baseplate/fastify/prisma/prisma-model',
    children: {
      fields: model.fields?.map(buildField),
    },
  };
}

export function buildModelsForFeature(
  feature: string,
  config: AppConfig
): unknown {
  const models = config.models?.filter((m) => m.feature === feature) || [];
  if (!models.length) {
    return {};
  }
  return models.map(buildModel);
}
