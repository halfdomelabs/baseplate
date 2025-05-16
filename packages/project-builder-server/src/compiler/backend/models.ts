import type {
  BackendAppConfig,
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
} from '@halfdomelabs/project-builder-lib';
import type { GeneratorBundle } from '@halfdomelabs/sync';

import {
  prismaFieldGenerator,
  prismaModelGenerator,
  prismaModelIdGenerator,
  prismaModelUniqueGenerator,
  prismaRelationFieldGenerator,
} from '@halfdomelabs/fastify-generators';
import { ModelFieldUtils, ModelUtils } from '@halfdomelabs/project-builder-lib';

import type {
  AppEntryBuilder,
  BackendAppEntryBuilder,
} from '../app-entry-builder.js';

function buildScalarField(
  builder: BackendAppEntryBuilder,
  model: ModelConfig,
  field: ModelScalarFieldConfig,
  order: number,
): GeneratorBundle {
  const { options } = field;
  const { primaryKeyFieldRefs, uniqueConstraints } = model.model;
  const isId =
    primaryKeyFieldRefs.length === 1 && primaryKeyFieldRefs.includes(field.id);
  const isUnique = uniqueConstraints?.some(
    (c) =>
      c.fields.length === 1 && c.fields.some((f) => f.fieldRef === field.id),
  );
  return prismaFieldGenerator({
    name: field.name,
    type: field.type,
    order,
    id: isId,
    options: {
      autoGenerate: options.genUuid,
      defaultToNow: options.defaultToNow,
      updatedAt: options.updatedAt,
      default: options.default,
      defaultEnumValue: builder.definitionContainer.nameFromId(
        options.defaultEnumValueRef,
      ),
    },
    optional: field.isOptional,
    unique: isUnique,
    enumType: options.enumRef && builder.nameFromId(options.enumRef),
  });
}

function buildRelationField(
  appBuilder: AppEntryBuilder<BackendAppConfig>,
  relationConfig: ModelRelationFieldConfig,
  parentModel: ModelConfig,
): GeneratorBundle {
  const { projectDefinition } = appBuilder;
  const {
    name,
    references,
    modelRef,
    foreignRelationName,
    onDelete,
    onUpdate,
  } = relationConfig;
  const foreignModel = ModelUtils.byIdOrThrow(projectDefinition, modelRef);

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
  ).filter(({ model }) => model.id === relationConfig.modelRef);
  const needsRelationName =
    foreignRelations.length +
      relations.filter((r) => r.modelRef === modelRef).length >
    1;

  return prismaRelationFieldGenerator({
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
  });
}

function buildModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): GeneratorBundle {
  return prismaModelGenerator({
    name: model.name,
    children: {
      fields: model.model.fields.map((field, idx) =>
        buildScalarField(appBuilder, model, field, idx),
      ),
      relations: model.model.relations?.map((r) =>
        buildRelationField(appBuilder, r, model),
      ),
      primaryKey:
        model.model.primaryKeyFieldRefs.length <= 1
          ? undefined
          : prismaModelIdGenerator({
              fields: model.model.primaryKeyFieldRefs.map((f) =>
                appBuilder.nameFromId(f),
              ),
            }),
      uniqueConstraints: model.model.uniqueConstraints
        ?.filter(({ fields }) => fields.length > 1)
        .map(({ fields }) =>
          prismaModelUniqueGenerator({
            fields: fields.map((f) => ({
              name: appBuilder.nameFromId(f.fieldRef),
            })),
          }),
        ),
    },
  });
}

export function buildModelsForFeature(
  appBuilder: BackendAppEntryBuilder,
  featureId: string,
): GeneratorBundle[] {
  const models = ModelUtils.getModelsForFeature(
    appBuilder.projectDefinition,
    featureId,
  );
  return models.map((m) => buildModel(appBuilder, m));
}
