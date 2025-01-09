import type { PrismaFieldDescriptor } from '@halfdomelabs/fastify-generators';
import type {
  BackendAppConfig,
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
} from '@halfdomelabs/project-builder-lib';

import {
  ModelFieldUtils,
  ModelUtils,
  undefinedIfEmpty,
  undefinedIfFalsy,
} from '@halfdomelabs/project-builder-lib';

import type {
  AppEntryBuilder,
  BackendAppEntryBuilder,
} from '../app-entry-builder.js';

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
    id: undefinedIfFalsy(isId),
    options: undefinedIfEmpty({
      autoGenerate: options.genUuid,
      defaultToNow: options.defaultToNow,
      updatedAt: options.updatedAt,
      default: options.default,
      defaultEnumValue: builder.definitionContainer.nameFromId(
        options.defaultEnumValueRef,
      ),
    }),
    optional: undefinedIfFalsy(field.isOptional),
    unique: undefinedIfFalsy(isUnique),
    enumType: options.enumRef && builder.nameFromId(options.enumRef),
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

  return {
    name,
    fields: references.map((r) =>
      appBuilder.definitionContainer.nameFromId(r.localRef),
    ),
    references: references.map((r) =>
      appBuilder.definitionContainer.nameFromId(r.foreignRef),
    ),
    modelName: parentModel.name,
    foreignModelName: foreignModel.name,
    foreignRelationName,
    relationshipName: needsRelationName ? foreignRelationName : undefined,
    relationshipType,
    optional,
    onDelete,
    onUpdate,
  };
}

function buildModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): Record<string, unknown> {
  return {
    name: model.name,
    generator: '@halfdomelabs/fastify/prisma/prisma-model',
    children: {
      fields: undefinedIfEmpty(
        model.model.fields.map((field) =>
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
          ?.filter(({ fields }) => fields.length > 1)
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
): Record<string, unknown>[] {
  const models = ModelUtils.getModelsForFeature(
    appBuilder.projectDefinition,
    featureId,
  );
  return models.map((m) => buildModel(appBuilder, m));
}
