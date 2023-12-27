import { z } from 'zod';

import {
  buildServiceTransformerReferences,
  transformerSchema,
} from './transformers.js';
import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldType,
} from './types.js';
import { featureEntityType } from '../features/index.js';
import type { ProjectConfig } from '../projectConfig.js';
import { ReferencesBuilder } from '../references.js';
import { VALIDATORS } from '../utils/validation.js';
import { zEnt, zRef, zRefBuilder } from '@src/references/index.js';
import { SCALAR_FIELD_TYPES } from '@src/types/fieldTypes.js';
import { randomUid } from '@src/utils/randomUid.js';

export * from './enums.js';
export * from './types.js';

export const modelScalarFieldSchema = zEnt(
  z.object({
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
  }),
  {
    type: modelScalarFieldType,
    parentPath: { context: 'model' },
  },
).transform((value) => {
  if (value.type !== 'enum' && value.options?.enumType) {
    return {
      ...value,
      options: {
        ...value.options,
        enumType: undefined,
      },
    };
  }
  return value;
});

export type ModelScalarFieldConfig = z.infer<typeof modelScalarFieldSchema>;

export const REFERENTIAL_ACTIONS = [
  'Cascade',
  'Restrict',
  'NoAction',
  'SetNull',
  'SetDefault',
] as const;

export const modelRelationFieldSchema = zRefBuilder(
  z.object({
    id: z.string().default(modelLocalRelationEntityType.generateNewId()),
    foreignId: z
      .string()
      .default(modelForeignRelationEntityType.generateNewId()),
    uid: z.string().default(randomUid),
    name: VALIDATORS.CAMEL_CASE_STRING,
    references: z.array(
      z.object({
        local: zRef(z.string(), {
          type: modelScalarFieldType,
          onDelete: 'RESTRICT',
          parentPath: { context: 'model' },
        }),
        foreign: zRef(z.string(), {
          type: modelScalarFieldType,
          onDelete: 'RESTRICT',
          parentPath: { context: 'foreignModel' },
        }),
      }),
    ),
    modelName: z.string().min(1),
    foreignRelationName: z.string().min(1),
    onDelete: z.enum(REFERENTIAL_ACTIONS).default('Cascade'),
    onUpdate: z.enum(REFERENTIAL_ACTIONS).default('Restrict'),
  }),
  (builder) => {
    builder.addReference({
      type: modelEntityType,
      onDelete: 'RESTRICT',
      addContext: 'foreignModel',
      path: 'modelName',
    });
    builder.addEntity({
      type: modelLocalRelationEntityType,
      parentPath: { context: 'model' },
    });
    builder.addEntity({
      type: modelForeignRelationEntityType,
      idPath: 'foreignId',
      namePath: 'foreignRelationName',
      parentPath: 'modelName',
    });
  },
);

export type ModelRelationFieldConfig = z.infer<typeof modelRelationFieldSchema>;

export const modelUniqueConstraintSchema = z.object({
  uid: z.string().default(randomUid),
  name: z.string().min(1),
  fields: z.array(
    z.object({
      name: zRef(z.string().min(1), {
        type: modelScalarFieldType,
        onDelete: 'RESTRICT',
        parentPath: { context: 'model' },
      }),
    }),
  ),
});

export type ModelUniqueConstraintConfig = z.infer<
  typeof modelUniqueConstraintSchema
>;

export const modelServiceSchema = z.object({
  build: z.boolean().optional(),
  create: z
    .object({
      fields: z
        .array(
          zRef(z.string(), {
            type: modelScalarFieldType,
            onDelete: 'DELETE',
            parentPath: { context: 'model' },
          }),
        )
        .optional(),
      transformerNames: z.array(z.string().min(1)).optional(),
    })
    .optional(),
  update: z
    .object({
      fields: z
        .array(
          zRef(z.string(), {
            type: modelScalarFieldType,
            onDelete: 'DELETE',
            parentPath: { context: 'model' },
          }),
        )
        .optional(),
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
  exposedFields: z
    .array(
      zRef(z.string(), {
        type: modelScalarFieldType,
        onDelete: 'DELETE',
        parentPath: { context: 'model' },
      }),
    )
    .optional(),
  exposedLocalRelations: z
    .array(
      zRef(z.string(), {
        type: modelLocalRelationEntityType,
        onDelete: 'DELETE',
        parentPath: { context: 'model' },
      }),
    )
    .optional(),
  exposedForeignRelations: z
    .array(
      zRef(z.string(), {
        type: modelForeignRelationEntityType,
        onDelete: 'DELETE',
        parentPath: { context: 'model' },
      }),
    )
    .optional(),
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

export const modelSchema = zEnt(
  z.object({
    uid: z.string().default(randomUid),
    name: VALIDATORS.PASCAL_CASE_STRING,
    feature: zRef(z.string().min(1), {
      type: featureEntityType,
      onDelete: 'RESTRICT',
    }),
    model: z.object({
      fields: z.array(modelScalarFieldSchema),
      relations: z.array(modelRelationFieldSchema).optional(),
      primaryKeys: z
        .array(
          zRef(z.string(), {
            type: modelScalarFieldType,
            onDelete: 'RESTRICT',
            parentPath: { context: 'model' },
          }),
        )
        .optional(),
      uniqueConstraints: z.array(modelUniqueConstraintSchema).optional(),
    }),
    service: modelServiceSchema.optional(),
    schema: modelSchemaSchema.optional(),
  }),
  { type: modelEntityType, addContext: 'model' },
);

export type ModelConfig = z.infer<typeof modelSchema>;

function buildModelScalarFieldReferences(
  modelName: string,
  field: ModelScalarFieldConfig,
  builder: ReferencesBuilder<ModelScalarFieldConfig>,
): void {
  if (field.type === 'enum') {
    builder.addReference('options.enumType', {
      category: 'enum',
    });
  }
}

function buildModelServiceReferences(
  config: ProjectConfig,
  modelName: string,
  service: ModelServiceConfig,
  builder: ReferencesBuilder<ModelServiceConfig>,
): void {
  builder.addReferences('create.transformerNames.*', {
    category: 'modelTransformer',
    generateKey: (name) => `${modelName}#${name}`,
  });

  builder.addReferences('update.transformerNames.*', {
    category: 'modelTransformer',
    generateKey: (name) => `${modelName}#${name}`,
  });

  service.transformers?.forEach((transformer, idx) =>
    buildServiceTransformerReferences(
      config,
      modelName,
      transformer,
      builder.withPrefix(`transformers.${idx}`),
    ),
  );
}

function buildModelSchemaReferences(
  modelName: string,
  schema: ModelSchemaConfig,
  builder: ReferencesBuilder<ModelSchemaConfig>,
): void {
  builder
    .addReferences('authorize.read.*', { category: 'role' })
    .addReferences('authorize.create.*', { category: 'role' })
    .addReferences('authorize.update.*', { category: 'role' })
    .addReferences('authorize.delete.*', { category: 'role' });
}

export function buildModelReferences(
  config: ProjectConfig,
  model: ModelConfig,
  builder: ReferencesBuilder<ModelConfig>,
): void {
  model.model.fields.forEach((field, idx) =>
    buildModelScalarFieldReferences(
      model.name,
      field,
      builder.withPrefix(`model.fields.${idx}`),
    ),
  );

  if (model.service) {
    buildModelServiceReferences(
      config,
      model.name,
      model.service,
      builder.withPrefix('service'),
    );
  }

  if (model.schema) {
    buildModelSchemaReferences(
      model.name,
      model.schema,
      builder.withPrefix('schema'),
    );
  }
}
