import {
  BackendAppConfig,
  FeatureUtils,
  ModelConfig,
  ModelFieldUtils,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ModelUtils,
} from '@halfdomelabs/project-builder-lib';

import { AppEntryBuilder, BackendAppEntryBuilder } from '../appEntryBuilder.js';

function buildScalarField(
  builder: BackendAppEntryBuilder,
  field: ModelScalarFieldConfig,
): unknown {
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
      defaultEnumValue: builder.definitionContainer.nameFromId(
        options.defaultEnumValue,
      ),
    },
    optional: field.isOptional,
    unique: field.isUnique,
    enumType: options.enumType && builder.nameFromId(options.enumType),
  };
}

function buildRelationField(
  appBuilder: AppEntryBuilder<BackendAppConfig>,
  relationConfig: ModelRelationFieldConfig,
  parentModel: ModelConfig,
): unknown {
  const { projectDefinition } = appBuilder;
  const {
    name,
    references,
    modelName,
    foreignRelationName,
    onDelete,
    onUpdate,
  } = relationConfig;
  const foreignModel = ModelUtils.byId(projectDefinition, modelName);

  const optional = ModelFieldUtils.isRelationOptional(
    parentModel,
    relationConfig,
  );
  const relationshipType = ModelFieldUtils.isRelationOneToOne(
    parentModel,
    relationConfig,
  )
    ? 'oneToOne'
    : 'oneToMany';
  const relations = parentModel.model.relations ?? [];

  // If there are multiple relations between the same models, we need to specify the
  // relation name to avoid conflicts in Prisma
  const foreignRelations = ModelUtils.getRelationsToModel(
    projectDefinition,
    parentModel.id,
  ).filter(({ model }) => model.id === relationConfig.modelName);
  const needsRelationName =
    foreignRelations.length +
      relations.filter((r) => r.modelName === modelName).length >
    1;
  const foreignFeature = FeatureUtils.getFeatureByIdOrThrow(
    projectDefinition,
    foreignModel.feature,
  ).name;

  return {
    name,
    fields: references.map((r) =>
      appBuilder.definitionContainer.nameFromId(r.local),
    ),
    references: references.map((r) =>
      appBuilder.definitionContainer.nameFromId(r.foreign),
    ),
    modelRef: `${foreignFeature}/root:$models.${foreignModel.name}`,
    foreignRelationName,
    relationshipName: needsRelationName ? foreignRelationName : undefined,
    relationshipType: relationshipType,
    optional,
    onDelete,
    onUpdate,
  };
}

function buildModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): unknown {
  return {
    name: model.name,
    generator: '@halfdomelabs/fastify/prisma/prisma-model',
    children: {
      fields: model.model.fields?.map((field) =>
        buildScalarField(appBuilder, field),
      ),
      relations: model.model.relations?.map((r) =>
        buildRelationField(appBuilder, r, model),
      ),
      primaryKey: {
        fields: model.model.primaryKeys?.map((f) => appBuilder.nameFromId(f)),
      },
      uniqueConstraints: model.model.uniqueConstraints?.map(
        ({ name, fields }) => ({
          name,
          fields: fields.map((f) => ({
            name: appBuilder.nameFromId(f.name),
          })),
        }),
      ),
    },
  };
}

export function buildModelsForFeature(
  appBuilder: BackendAppEntryBuilder,
  featureId: string,
): unknown {
  const models = ModelUtils.getModelsForFeature(
    appBuilder.projectDefinition,
    featureId,
  );
  return models.map((m) => buildModel(appBuilder, m));
}
