import { ParsedAppConfig } from '@src/parser';
import {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
} from '../../schema/models';

function buildScalarField(field: ModelScalarFieldConfig): unknown {
  const { options = {} } = field;
  return {
    name: field.name,
    type: field.type,
    id: field.isId,
    options: {
      autoGenerate: options.genUuid,
      defaultToNow: options.defaultToNow,
      updatedAt: options.updatedAt,
    },
    optional: field.isOptional,
    unique: field.isUnique,
  };
}

function buildRelationField(
  {
    name,
    references,
    modelName,
    foreignFieldName,
    relationshipName,
    relationshipType,
    isOptional,
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
    fields: references.map((r) => r.local),
    references: references.map((r) => r.foreign),
    modelRef: `${model.feature}/root:$models.${model.name}`,
    foreignFieldName,
    relationshipName,
    relationshipType,
    optional: isOptional,
    onDelete,
    onUpdate,
  };
}

function buildModel(model: ModelConfig, parsedApp: ParsedAppConfig): unknown {
  return {
    name: model.name,
    generator: '@baseplate/fastify/prisma/prisma-model',
    children: {
      fields: model.model.fields?.map(buildScalarField),
      relations: model.model.relations?.map((r) =>
        buildRelationField(r, parsedApp)
      ),
      primaryKey: {
        fields: model.model.primaryKeys,
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
