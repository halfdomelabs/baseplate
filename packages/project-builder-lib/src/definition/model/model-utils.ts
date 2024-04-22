import {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ProjectDefinition,
} from '@src/schema/index.js';

function byId(projectDefinition: ProjectDefinition, id: string): ModelConfig {
  const model = projectDefinition.models.find((m) => m.id === id);
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

function getRelationsToModel(
  projectDefinition: ProjectDefinition,
  modelId: string,
): { model: ModelConfig; relation: ModelRelationFieldConfig }[] {
  return projectDefinition.models.flatMap((m) => {
    return (
      m.model.relations
        ?.filter((r) => {
          return r.modelName === modelId;
        })
        .map((r) => {
          return { model: m, relation: r };
        }) ?? []
    );
  });
}

function getModelsForFeature(
  projectDefinition: ProjectDefinition,
  featureId: string,
): ModelConfig[] {
  return projectDefinition.models.filter((m) => m.feature === featureId);
}

function getModelIdFields(model: ModelConfig): string[] {
  return (
    model.model.primaryKeys ??
    model.model.fields.filter((f) => f.isId).map((f) => f.id)
  );
}

export const ModelUtils = {
  byId,
  getScalarFieldById,
  getRelationsToModel,
  getModelsForFeature,
  getModelIdFields,
};
