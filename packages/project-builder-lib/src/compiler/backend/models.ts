import { ParsedProjectConfig } from '@src/parser/index.js';
import {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ModelUniqueConstraintConfig,
} from '../../schema/models/index.js';

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
      default: options.default,
    },
    optional: field.isOptional,
    unique: field.isUnique,
    enumType: options.enumType,
  };
}

function buildRelationField(
  {
    name,
    references,
    modelName,
    foreignRelationName,
    relationshipName,
    relationshipType,
    isOptional,
    onDelete,
    onUpdate,
  }: ModelRelationFieldConfig,
  parsedProject: ParsedProjectConfig,
): unknown {
  const model = parsedProject.getModels().find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Could not find model ${modelName}`);
  }
  return {
    name,
    fields: references.map((r) => r.local),
    references: references.map((r) => r.foreign),
    modelRef: `${model.feature}/root:$models.${model.name}`,
    foreignRelationName,
    relationshipName,
    relationshipType,
    optional: isOptional,
    onDelete,
    onUpdate,
  };
}

function buildUniqueConstraint({
  name,
  fields,
}: ModelUniqueConstraintConfig): unknown {
  return {
    name,
    fields,
  };
}

function buildModel(
  model: ModelConfig,
  parsedProject: ParsedProjectConfig,
): unknown {
  return {
    name: model.name,
    generator: '@halfdomelabs/fastify/prisma/prisma-model',
    children: {
      fields: model.model.fields?.map(buildScalarField),
      relations: model.model.relations?.map((r) =>
        buildRelationField(r, parsedProject),
      ),
      primaryKey: {
        fields: model.model.primaryKeys,
      },
      uniqueConstraints: model.model.uniqueConstraints?.map(
        buildUniqueConstraint,
      ),
    },
  };
}

export function buildModelsForFeature(
  feature: string,
  parsedProject: ParsedProjectConfig,
): unknown {
  const models =
    parsedProject.getModels().filter((m) => m.feature === feature) ?? [];
  if (!models.length) {
    return {};
  }
  return models.map((m) => buildModel(m, parsedProject));
}
