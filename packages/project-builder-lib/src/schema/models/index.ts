import { z } from 'zod';

import { transformerSchema } from './transformers.js';
import {
  modelEntityType,
  modelEnumEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldType,
  modelTransformerEntityType,
} from './types.js';
import { featureEntityType } from '../features/index.js';
import { VALIDATORS } from '../utils/validation.js';
import { zEnt, zRef, zRefBuilder } from '@src/references/index.js';
import { authRoleEntityType } from '@src/schema/auth/types.js';
import { SCALAR_FIELD_TYPES } from '@src/types/fieldTypes.js';

export * from './enums.js';
export * from './types.js';

export const modelScalarFieldSchema = zEnt(
  z.object({
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
        enumType: zRef(z.string().optional(), {
          type: modelEnumEntityType,
          onDelete: 'RESTRICT',
        }),
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
    id: z.string().default(() => modelLocalRelationEntityType.generateNewId()),
    foreignId: z
      .string()
      .default(() => modelForeignRelationEntityType.generateNewId()),
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
      stripIdWhenSerializing: true,
    });
    builder.addEntity({
      type: modelForeignRelationEntityType,
      idPath: 'foreignId',
      namePath: 'foreignRelationName',
      parentPath: 'modelName',
      stripIdWhenSerializing: true,
    });
  },
);

export type ModelRelationFieldConfig = z.infer<typeof modelRelationFieldSchema>;

export const modelUniqueConstraintSchema = z.object({
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
      transformerNames: z
        .array(
          zRef(z.string(), {
            type: modelTransformerEntityType,
            onDelete: 'DELETE',
            parentPath: { context: 'model' },
          }),
        )
        .optional(),
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
      transformerNames: z
        .array(
          zRef(z.string(), {
            type: modelTransformerEntityType,
            onDelete: 'DELETE',
            parentPath: { context: 'model' },
          }),
        )
        .optional(),
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

const roleArray = z
  .array(
    zRef(z.string(), {
      type: authRoleEntityType,
      onDelete: 'DELETE',
    }),
  )
  .optional();

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
      read: roleArray,
      create: roleArray,
      update: roleArray,
      delete: roleArray,
    })
    .optional(),
});

export type ModelSchemaConfig = z.infer<typeof modelSchemaSchema>;

export const modelSchema = zEnt(
  z.object({
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
