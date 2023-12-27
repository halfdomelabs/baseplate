import {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ModelUniqueConstraintConfig,
} from '../../schema/models/index.js';
import { ParsedProjectConfig } from '@src/parser/index.js';
import {
  isModelRelationOneToOne,
  isModelRelationOptional,
} from '@src/schema-utils/model.js';

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
  relationConfig: ModelRelationFieldConfig,
  parentModel: ModelConfig,
  parsedProject: ParsedProjectConfig,
): unknown {
  const {
    name,
    references,
    modelName,
    foreignRelationName,
    onDelete,
    onUpdate,
  } = relationConfig;
  const foreignModel = parsedProject
    .getModels()
    .find((m) => m.name === modelName);
  if (!foreignModel) {
    throw new Error(`Could not find foreign model ${modelName}`);
  }

  const optional = isModelRelationOptional(parentModel, relationConfig);
  const relationshipType = isModelRelationOneToOne(parentModel, relationConfig)
    ? 'oneToOne'
    : 'oneToMany';
  const relations = parentModel.model.relations ?? [];

  // If there are multiple relations between the same models, we need to specify the
  // relation name to avoid conflicts in Prisma
  const needsRelationName =
    (foreignModel.model.relations?.filter(
      (r) => r.modelName === parentModel.name,
    ).length ?? 0) +
      relations.filter((r) => r.modelName === modelName).length >
    1;

  return {
    name,
    fields: references.map((r) => r.local),
    references: references.map((r) => r.foreign),
    modelRef: `${foreignModel.feature}/root:$models.${foreignModel.name}`,
    foreignRelationName,
    relationshipName: needsRelationName ? foreignRelationName : undefined,
    relationshipType: relationshipType,
    optional,
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
        buildRelationField(r, model, parsedProject),
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
  featureId: string,
  parsedProject: ParsedProjectConfig,
): unknown {
  const models =
    parsedProject.getModels().filter((m) => m.feature === featureId) ?? [];
  if (!models.length) {
    return {};
  }
  return models.map((m) => buildModel(m, parsedProject));
}
