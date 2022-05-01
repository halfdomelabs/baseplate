import * as yup from 'yup';
import { SCALAR_FIELD_TYPES } from '@src/types/fieldTypes';
import { randomUid } from '@src/utils/randomUid';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';
import type { ProjectConfig } from '../projectConfig';
import { ReferencesBuilder } from '../references';
import {
  embeddedRelationTransformerSchema,
  passwordTransformerSchema,
  TransformerConfig,
} from './transformers';

export const modelScalarFieldSchema = yup.object({
  uid: yup.string().default(randomUid),
  name: yup.string().required(),
  type: yup
    .string()
    .oneOf([...SCALAR_FIELD_TYPES])
    .required(),
  isId: yup.boolean(),
  isOptional: yup.boolean(),
  isUnique: yup.boolean(),
  options: yup
    .object({
      // string options
      default: yup.string(),
      // uuid options
      genUuid: yup.boolean(),
      // date options
      updatedAt: yup.boolean(),
      defaultToNow: yup.boolean(),
    })
    .default(undefined),
});

export type ModelScalarFieldConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof modelScalarFieldSchema>
>;

export const REFERENTIAL_ACTIONS = [
  'Cascade',
  'Restrict',
  'NoAction',
  'SetNull',
  'SetDefault',
];

export const modelRelationFieldSchema = yup.object({
  uid: yup.string().default(randomUid),
  name: yup.string().required(),
  references: yup
    .array(
      yup
        .object({
          local: yup.string().required(),
          foreign: yup.string().required(),
        })
        .required()
    )
    .required(),
  modelName: yup.string().required(),
  foreignRelationName: yup.string().required(),
  relationshipName: yup.string(),
  relationshipType: yup
    .string()
    .oneOf(['oneToOne', 'oneToMany'])
    .default('oneToMany'),
  isOptional: yup.boolean().default(false),
  onDelete: yup.string().oneOf(REFERENTIAL_ACTIONS).default('Cascade'),
  onUpdate: yup.string().oneOf(REFERENTIAL_ACTIONS).default('Restrict'),
});

export type ModelRelationFieldConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof modelRelationFieldSchema>
>;

export const modelUniqueConstraintSchema = yup.object({
  uid: yup.string().default(randomUid),
  name: yup.string().required(),
  fields: yup
    .array(yup.object({ name: yup.string().required() }).required())
    .required(),
});

export type ModelUniqueConstraintConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof modelUniqueConstraintSchema>
>;

export const modelServiceSchema = yup.object({
  build: yup.boolean(),
  create: yup
    .object({
      fields: yup.array(yup.string().required()),
      transformerNames: yup.array(yup.string().required()),
    })
    .default(undefined),
  update: yup
    .object({
      fields: yup.array(yup.string().required()),
      transformerNames: yup.array(yup.string().required()),
    })
    .default(undefined),
  delete: yup
    .object({
      disabled: yup.boolean(),
    })
    .default(undefined),
  transformers: yup.array().of(
    yup.lazy((value: TransformerConfig) => {
      switch (value.type) {
        case 'embeddedRelation':
          return embeddedRelationTransformerSchema.required();
        case 'password':
          return passwordTransformerSchema.required();
        default:
          throw new Error(
            `Unknown transformer type: ${(value as { type: string }).type}`
          );
      }
    }) as unknown as yup.SchemaOf<TransformerConfig>
  ),
});

export type ModelServiceConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof modelServiceSchema>
>;

export const modelSchemaSchema = yup.object({
  buildObjectType: yup.boolean(),
  exposedFields: yup.array(yup.string().required()),
  exposedLocalRelations: yup.array(yup.string().required()),
  exposedForeignRelations: yup.array(yup.string().required()),
  buildQuery: yup.boolean(),
  buildMutations: yup.boolean(),
  authorize: yup.object({
    read: yup.array(yup.string().required()),
    create: yup.array(yup.string().required()),
    update: yup.array(yup.string().required()),
    delete: yup.array(yup.string().required()),
  }),
});

export type ModelSchemaConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof modelSchemaSchema>
>;

export const modelSchema = yup.object({
  uid: yup.string().default(randomUid),
  name: yup.string().required(),
  feature: yup.string().required(),
  model: yup.object({
    fields: yup.array(modelScalarFieldSchema.required()).required(),
    relations: yup.array(modelRelationFieldSchema.required()),
    primaryKeys: yup.array(yup.string().required()),
    uniqueConstraints: yup.array(modelUniqueConstraintSchema.required()),
  }),
  service: modelServiceSchema.default(undefined),
  schema: modelSchemaSchema.default(undefined),
});

export type ModelConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof modelSchema>
>;

function buildModelScalarFieldReferences(
  modelName: string,
  field: ModelScalarFieldConfig,
  builder: ReferencesBuilder<ModelScalarFieldConfig>
): void {
  builder.addReferenceable({
    category: 'modelField',
    id: field.uid,
    key: `${modelName}#${field.name}`,
    name: field.name,
  });
}

function buildModelRelationFieldReferences(
  modelName: string,
  field: ModelRelationFieldConfig,
  builder: ReferencesBuilder<ModelRelationFieldConfig>
): void {
  builder.addReferenceable({
    category: 'modelLocalRelation',
    id: field.uid,
    key: `${modelName}#${field.name}`,
    name: field.name,
  });
  builder.addReferenceable({
    category: 'modelForeignRelation',
    id: field.uid,
    key: `${field.modelName}#${field.foreignRelationName}`,
    name: field.foreignRelationName,
  });

  builder.addReferences('references.*.foreign', {
    category: 'modelField',
    generateKey: (name) => `${field.modelName}#${name}`,
  });
  builder.addReferences('references.*.local', {
    referenceType: 'modelLocalRelation',
    category: 'modelField',
    generateKey: (name) => `${modelName}#${name}`,
  });
}

function buildServiceTransformerReferences(
  originalConfig: ProjectConfig,
  modelName: string,
  transformer: TransformerConfig,
  builder: ReferencesBuilder<TransformerConfig>
): void {
  builder.addReferenceable({
    category: 'modelTransformer',
    id: transformer.uid,
    key: `${modelName}#${transformer.name}`,
    name: transformer.name,
  });

  if (transformer.type === 'embeddedRelation') {
    builder.addReference('name', {
      category: 'modelForeignRelation',
      key: `${modelName}#${transformer.name}`,
    });

    const localRelationName = transformer.name;
    const foreignModel = originalConfig.models?.find((model) =>
      model.model.relations?.some(
        (relation) =>
          relation.modelName === modelName &&
          relation.foreignRelationName === localRelationName
      )
    );

    if (!foreignModel) {
      throw new Error(
        `Could not find model associated with embedded relation ${modelName}/${localRelationName}`
      );
    }

    builder.addReferences('embeddedFieldNames.*', {
      category: 'modelField',
      generateKey: (name) => `${foreignModel.name}#${name}`,
    });
  }
}

function buildModelServiceReferences(
  config: ProjectConfig,
  modelName: string,
  service: ModelServiceConfig,
  builder: ReferencesBuilder<ModelServiceConfig | undefined>
): void {
  builder
    .addReferences('create.fields.*', {
      category: 'modelField',
      generateKey: (name) => `${modelName}#${name}`,
    })
    .addReferences('create.transformerNames.*', {
      category: 'modelTransformer',
      generateKey: (name) => `${modelName}#${name}`,
    });

  builder
    .addReferences('update.fields.*', {
      category: 'modelField',
      generateKey: (name) => `${modelName}#${name}`,
    })
    .addReferences('update.transformerNames.*', {
      category: 'modelTransformer',
      generateKey: (name) => `${modelName}#${name}`,
    });

  service.transformers?.forEach((transformer, idx) =>
    buildServiceTransformerReferences(
      config,
      modelName,
      transformer,
      builder.withPrefix(`transformers.${idx}`)
    )
  );
}

function buildModelSchemaReferences(
  modelName: string,
  schema: ModelSchemaConfig,
  builder: ReferencesBuilder<ModelSchemaConfig | undefined>
): void {
  builder
    .addReferences('exposedFields.*', {
      category: 'modelField',
      generateKey: (name) => `${modelName}#${name}`,
    })
    .addReferences('exposedLocalRelations.*', {
      category: 'modelLocalRelation',
      generateKey: (name) => `${modelName}#${name}`,
    })
    .addReferences('exposedForeignRelations.*', {
      category: 'modelForeignRelation',
      generateKey: (name) => `${modelName}#${name}`,
    });

  builder
    .addReferences('authorize.read.*', { category: 'role' })
    .addReferences('authorize.create.*', { category: 'role' })
    .addReferences('authorize.update.*', { category: 'role' })
    .addReferences('authorize.delete.*', { category: 'role' });
}

export function buildModelReferences(
  config: ProjectConfig,
  model: ModelConfig,
  builder: ReferencesBuilder<ModelConfig>
): void {
  builder.addReferenceable({
    category: 'model',
    id: model.uid,
    name: model.name,
  });

  builder.addReference('feature', { category: 'feature' });

  model.model.primaryKeys?.forEach((primaryKey, idx) =>
    builder.addReference(`model.primaryKeys.${idx}`, {
      referenceType: 'modelPrimaryKey',
      category: 'modelField',
      key: `${model.name}#${primaryKey}`,
    })
  );

  model.model.uniqueConstraints?.forEach((constraint, idx) => {
    const subBuilder = builder.withPrefix(`model.uniqueConstraints.${idx}`);

    constraint.fields.forEach((field, fieldIdx) => {
      subBuilder.withPrefix(`fields.${fieldIdx}`).addReference('name', {
        referenceType: 'modelUniqueConstraint',
        category: 'modelField',
        key: `${model.name}#${field.name}`,
      });
    });
  });

  model.model.fields.forEach((field, idx) =>
    buildModelScalarFieldReferences(
      model.name,
      field,
      builder.withPrefix(`model.fields.${idx}`)
    )
  );

  model.model.relations?.forEach((relation, idx) =>
    buildModelRelationFieldReferences(
      model.name,
      relation,
      builder.withPrefix(`model.relations.${idx}`)
    )
  );

  if (model.service) {
    buildModelServiceReferences(
      config,
      model.name,
      model.service,
      builder.withPrefix('service')
    );
  }

  if (model.schema) {
    buildModelSchemaReferences(
      model.name,
      model.schema,
      builder.withPrefix('schema')
    );
  }
}
