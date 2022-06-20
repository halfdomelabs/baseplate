import { z } from 'zod';
import { SCALAR_FIELD_TYPES } from '@src/types/fieldTypes';
import { randomUid } from '@src/utils/randomUid';
import type { ProjectConfig } from '../projectConfig';
import { ReferencesBuilder } from '../references';
import { TransformerConfig, transformerSchema } from './transformers';

export const modelScalarFieldSchema = z.object({
  uid: z.string().default(randomUid),
  name: z.string().min(1),
  type: z.enum(SCALAR_FIELD_TYPES),
  isId: z.boolean().optional(),
  isOptional: z.boolean().optional(),
  isUnique: z.boolean().optional(),
  options: z
    .object({
      // string options
      default: z.string().optional(),
      // uuid options
      genUuid: z.boolean().optional(),
      // date options
      updatedAt: z.boolean().optional(),
      defaultToNow: z.boolean().optional(),
      // enum options
      enumType: z.string().optional(),
    })
    .optional(),
});

export type ModelScalarFieldConfig = z.infer<typeof modelScalarFieldSchema>;

export const REFERENTIAL_ACTIONS = [
  'Cascade',
  'Restrict',
  'NoAction',
  'SetNull',
  'SetDefault',
] as const;

export const modelRelationFieldSchema = z.object({
  uid: z.string().default(randomUid),
  name: z.string().min(1),
  references: z.array(
    z.object({
      local: z.string().min(1),
      foreign: z.string().min(1),
    })
  ),
  modelName: z.string().min(1),
  foreignRelationName: z.string().min(1),
  relationshipName: z.string().optional(),
  relationshipType: z.enum(['oneToOne', 'oneToMany']).default('oneToMany'),
  isOptional: z.boolean().optional().default(false),
  onDelete: z.enum(REFERENTIAL_ACTIONS).default('Cascade'),
  onUpdate: z.enum(REFERENTIAL_ACTIONS).default('Restrict'),
});

export type ModelRelationFieldConfig = z.infer<typeof modelRelationFieldSchema>;

export const modelUniqueConstraintSchema = z.object({
  uid: z.string().default(randomUid),
  name: z.string().min(1),
  fields: z.array(z.object({ name: z.string().min(1) })),
});

export type ModelUniqueConstraintConfig = z.infer<
  typeof modelUniqueConstraintSchema
>;

export const modelServiceSchema = z.object({
  build: z.boolean().optional(),
  create: z
    .object({
      fields: z.array(z.string().min(1)).optional(),
      transformerNames: z.array(z.string().min(1)).optional(),
    })
    .optional(),
  update: z
    .object({
      fields: z.array(z.string().min(1)).optional(),
      transformerNames: z.array(z.string().min(1)).optional(),
    })
    .optional(),
  delete: z
    .object({
      disabled: z.boolean().optional(),
    })
    .optional(),
  transformers: z.array(transformerSchema).optional(),
});

export type ModelServiceConfig = z.infer<typeof modelServiceSchema>;

export const modelSchemaSchema = z.object({
  buildObjectType: z.boolean().optional(),
  exposedFields: z.array(z.string().min(1)).optional(),
  exposedLocalRelations: z.array(z.string().min(1)).optional(),
  exposedForeignRelations: z.array(z.string().min(1)).optional(),
  buildQuery: z.boolean().optional(),
  buildMutations: z.boolean().optional(),
  authorize: z
    .object({
      read: z.array(z.string().min(1)).optional(),
      create: z.array(z.string().min(1)).optional(),
      update: z.array(z.string().min(1)).optional(),
      delete: z.array(z.string().min(1)).optional(),
    })
    .optional(),
});

export type ModelSchemaConfig = z.infer<typeof modelSchemaSchema>;

export const modelSchema = z.object({
  uid: z.string().default(randomUid),
  name: z.string().min(1),
  feature: z.string().min(1),
  model: z.object({
    fields: z.array(modelScalarFieldSchema),
    relations: z.array(modelRelationFieldSchema).optional(),
    primaryKeys: z.array(z.string().min(1)).optional(),
    uniqueConstraints: z.array(modelUniqueConstraintSchema).optional(),
  }),
  service: modelServiceSchema.optional(),
  schema: modelSchemaSchema.optional(),
});

export type ModelConfig = z.infer<typeof modelSchema>;

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
  if (field.type === 'enum') {
    builder.addReference('options.enumType', {
      category: 'enum',
    });
  }
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
