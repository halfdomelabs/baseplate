import { ModelConfig, ModelScalarFieldConfig } from '@src/schema/index.js';

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
  getScalarFieldById,
};
