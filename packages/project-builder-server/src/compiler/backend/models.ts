import type { PrismaFieldDescriptor } from '@halfdomelabs/fastify-generators';
import {
  BackendAppConfig,
  FeatureUtils,
  ModelConfig,
  ModelFieldUtils,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ModelUtils,
  undefinedIfEmpty,
} from '@halfdomelabs/project-builder-lib';

import { AppEntryBuilder, BackendAppEntryBuilder } from '../appEntryBuilder.js';

function buildScalarField(
  builder: BackendAppEntryBuilder,
  model: ModelConfig,
  field: ModelScalarFieldConfig,
): PrismaFieldDescriptor {
  const { options = {} } = field;
  const { primaryKeyFieldRefs, uniqueConstraints } = model.model;
  const isId =
    primaryKeyFieldRefs.length === 1 && primaryKeyFieldRefs.includes(field.id);
  const isUnique = uniqueConstraints?.some(
    (c) =>
      c.fields.length === 1 && c.fields.some((f) => f.fieldRef === field.id),
  );
  return {
    name: field.name,
    type: field.type,
    id: undefinedIfEmpty(isId),
    options: undefinedIfEmpty({
      autoGenerate: options.genUuid,
      defaultToNow: options.defaultToNow,
      updatedAt: options.updatedAt,
      default: options.default,
      defaultEnumValue: builder.definitionContainer.nameFromId(
        options.defaultEnumValue,
      ),
    }),
    optional: field.isOptional,
    unique: undefinedIfEmpty(isUnique),
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
  const foreignModel = ModelUtils.byIdOrThrow(projectDefinition, modelName);

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
      fields: undefinedIfEmpty(
        model.model.fields?.map((field) =>
          buildScalarField(appBuilder, model, field),
        ),
      ),
      relations: undefinedIfEmpty(
        model.model.relations?.map((r) =>
          buildRelationField(appBuilder, r, model),
        ),
      ),
      primaryKey:
        model.model.primaryKeyFieldRefs.length <= 1
          ? undefined
          : {
              fields: model.model.primaryKeyFieldRefs.map((f) =>
                appBuilder.nameFromId(f),
              ),
            },
      uniqueConstraints: undefinedIfEmpty(
        model.model.uniqueConstraints
          ?.filter(({ fields }) => {
            return fields.length > 1;
          })
          .map(({ fields }) => ({
            name: fields
              .map((f) => appBuilder.nameFromId(f.fieldRef))
              .join('_'),
            fields: fields.map((f) => ({
              name: appBuilder.nameFromId(f.fieldRef),
            })),
          })),
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
