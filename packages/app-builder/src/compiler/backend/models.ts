import { ParsedAppConfig } from '@src/parser';
import {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
} from '../../schema/models';

function buildScalarField(field: ModelScalarFieldConfig): unknown {
  return {
    name: field.name,
    type: field.type,
    id: field.id,
    options: {
      autoGenerate: field.genUuid,
      defaultToNow: field.defaultToNow,
      updatedAt: field.updatedAt,
    },
    optional: field.optional,
    unique: field.unique,
  };
}

function buildRelationField(
  {
    name,
    fields,
    references,
    modelName,
    foreignFieldName,
    relationshipName,
    relationshipType,
    optional,
    onDelete,
    onUpdate,
  }: ModelRelationFieldConfig,
  parsedApp: ParsedAppConfig
): unknown {
  const model = parsedApp.getModels().find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Could not find model ${modelName}`);
  }
  return {
    name,
    fields,
    references,
    modelRef: `${model.feature}/root:$models.${model.name}`,
    foreignFieldName,
    relationshipName,
    relationshipType,
    optional,
    onDelete,
    onUpdate,
  };
}

function buildModel(model: ModelConfig, parsedApp: ParsedAppConfig): unknown {
  return {
    name: model.name,
    generator: '@baseplate/fastify/prisma/prisma-model',
    children: {
      fields: model.fields?.map(buildScalarField),
      relations: model.relations?.map((r) => buildRelationField(r, parsedApp)),
      primaryKey: {
        fields: model.primaryKeys,
      },
    },
  };
}

export function buildModelsForFeature(
  feature: string,
  parsedApp: ParsedAppConfig
): unknown {
  const models =
    parsedApp.getModels().filter((m) => m.feature === feature) || [];
  if (!models.length) {
    return {};
  }
  return models.map((m) => buildModel(m, parsedApp));
}
