import {
  ModelConfig,
  ModelScalarFieldConfig,
  ProjectConfig,
} from '@src/schema/index.js';

function byId(projectConfig: ProjectConfig, id: string): ModelConfig {
  const model = projectConfig.models.find((m) => m.id === id);
  if (!model) {
    throw new Error(`Could not find model with ID ${id}`);
  }
  return model;
}

function getScalarFieldById(
  model: ModelConfig,
  id: string,
): ModelScalarFieldConfig {
  const field = model.model.fields.find((f) => f.id === id);

  if (!field) {
    throw new Error(`Could not find field with ID ${id}`);
  }
  return field;
}

export const ModelUtils = {
  byId,
  getScalarFieldById,
};
