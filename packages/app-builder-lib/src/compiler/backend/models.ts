import { ParsedAppConfig } from '@src/parser';
import {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
} from '../../schema/models';

function buildScalarField(field: ModelScalarFieldConfig): unknown {
  const { model } = field;
  return {
    name: field.name,
    type: model.type,
    id: model.id,
    options: {
      autoGenerate: model.genUuid,
      defaultToNow: model.defaultToNow,
      updatedAt: model.updatedAt,
    },
    optional: model.optional,
    unique: model.unique,
  };
}

function buildRelationField(
  {
    name,
    model: {
      fields,
      references,
      modelName,
      foreignFieldName,
      relationshipName,
      relationshipType,
      optional,
      onDelete,
      onUpdate,
    },
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
