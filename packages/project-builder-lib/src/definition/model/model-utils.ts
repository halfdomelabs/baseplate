import { PASCAL_CASE_REGEX } from '@halfdomelabs/utils';

import type {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ProjectDefinition,
} from '@src/schema/index.js';

function byId(
  projectDefinition: ProjectDefinition,
  id: string,
): ModelConfig | undefined {
  return projectDefinition.models.find((m) => m.id === id);
}

function byIdOrThrow(
  projectDefinition: ProjectDefinition,
  id: string,
): ModelConfig {
  const model = byId(projectDefinition, id);
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
  return projectDefinition.models.flatMap(
    (m) =>
      m.model.relations
        ?.filter((r) => r.modelRef === modelId)
        .map((r) => ({ model: m, relation: r })) ?? [],
  );
}

function getModelsForFeature(
  projectDefinition: ProjectDefinition,
  featureId: string,
): ModelConfig[] {
  return projectDefinition.models.filter((m) => m.featureRef === featureId);
}

function getModelIdFields(model: ModelConfig): string[] {
  return model.model.primaryKeyFieldRefs;
}

function hasService(model: ModelConfig): boolean {
  return (
    !!model.service.create.enabled ||
    !!model.service.update.enabled ||
    !!model.service.delete.enabled ||
    model.service.transformers.length > 0
  );
}

function validateModelName(name: string): boolean {
  return PASCAL_CASE_REGEX.test(name);
}

/**
 * Returns the ID of a model by name, or the name if no model is found.
 * @param projectDefinition - The project definition.
 * @param name - The name of the model.
 * @returns The ID of the model, or the name if no model is found.
 */
function getModelIdByNameOrDefault(
  projectDefinition: ProjectDefinition,
  name: string,
): string {
  return projectDefinition.models.find((m) => m.name === name)?.id ?? name;
}

export const ModelUtils = {
  byId,
  byIdOrThrow,
  getScalarFieldById,
  getRelationsToModel,
  getModelsForFeature,
  getModelIdFields,
  hasService,
  validateModelName,
  getModelIdByNameOrDefault,
};
