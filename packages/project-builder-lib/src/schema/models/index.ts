import { z } from 'zod';

import {
  createDefinitionEntityNameResolver,
  zEnt,
  zRef,
  zRefBuilder,
  zRefId,
} from '#src/references/index.js';
import { SCALAR_FIELD_TYPES } from '#src/types/field-types.js';

import { featureEntityType } from '../features/index.js';
import { VALIDATORS } from '../utils/validation.js';
import { modelGraphqlSchema } from './graphql.js';
import { transformerSchema } from './transformers/transformers.js';
import {
  modelEntityType,
  modelEnumEntityType,
  modelEnumValueEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
  modelTransformerEntityType,
  modelUniqueConstraintEntityType,
} from './types.js';

export * from './enums.js';
export * from './graphql.js';
export * from './transformers/index.js';
export * from './types.js';

export const modelScalarFieldSchema = zEnt(
  z.object({
    name: VALIDATORS.CAMEL_CASE_STRING,
    type: z.enum(SCALAR_FIELD_TYPES),
    isOptional: z.boolean().default(false),
    options: zRefBuilder(
      z
        .object({
          // string options
          default: z.string().default(''),
          // uuid options
          genUuid: z.boolean().optional(),
          // date options
          updatedAt: z.boolean().optional(),
          defaultToNow: z.boolean().optional(),
          // enum options
          enumRef: zRef(z.string().optional(), {
            type: modelEnumEntityType,
            onDelete: 'RESTRICT',
          }),
          defaultEnumValueRef: z.string().optional(),
        })
        .transform((val) => ({
          ...val,
          ...(val.enumRef ? {} : { defaultEnumValueRef: undefined }),
        }))
        .default({ default: '' }),
      (builder) => {
        builder.addReference({
          type: modelEnumValueEntityType,
          onDelete: 'RESTRICT',
          path: 'defaultEnumValueRef',
          parentPath: 'enumRef',
        });
      },
    ),
  }),
  {
    type: modelScalarFieldEntityType,
    parentPath: { context: 'model' },
  },
)
  .superRefine((arg, ctx) => {
    // check default values
    const defaultValue = arg.options.default;
    const { type } = arg;
    if (!defaultValue) {
      return;
    }
    if (type === 'boolean' && !['true', 'false'].includes(defaultValue)) {
      ctx.addIssue({
        path: ['options', 'default'],
        code: 'custom',
        message: 'Default value must be true or false',
      });
    }
  })
  .transform((value) => {
    if (value.type !== 'enum' && value.options.enumRef) {
      return {
        ...value,
        options: {
          ...value.options,
          enumRef: undefined,
        },
      };
    }
    return value;
  });

export type ModelScalarFieldConfig = z.infer<typeof modelScalarFieldSchema>;

export type ModelScalarFieldConfigInput = z.input<
  typeof modelScalarFieldSchema
>;

export const REFERENTIAL_ACTIONS = [
  'Cascade',
  'Restrict',
  'NoAction',
  'SetNull',
  'SetDefault',
] as const;

export const modelRelationFieldSchema = zRefBuilder(
  z.object({
    id: zRefId,
    foreignId: z
      .string()
      .default(() => modelForeignRelationEntityType.generateNewId()),
    name: VALIDATORS.CAMEL_CASE_STRING,
    references: z.array(
      z.object({
        localRef: zRef(z.string(), {
          type: modelScalarFieldEntityType,
          onDelete: 'RESTRICT',
          parentPath: { context: 'model' },
        }),
        foreignRef: zRef(z.string(), {
          type: modelScalarFieldEntityType,
          onDelete: 'RESTRICT',
          parentPath: { context: 'foreignModel' },
        }),
      }),
    ),
    modelRef: z.string().min(1),
    foreignRelationName: VALIDATORS.CAMEL_CASE_STRING,
    onDelete: z.enum(REFERENTIAL_ACTIONS).default('Cascade'),
    onUpdate: z.enum(REFERENTIAL_ACTIONS).default('Restrict'),
  }),
  (builder) => {
    builder.addReference({
      type: modelEntityType,
      onDelete: 'RESTRICT',
      addContext: 'foreignModel',
      path: 'modelRef',
    });
    builder.addEntity({
      type: modelLocalRelationEntityType,
      parentPath: { context: 'model' },
    });
    builder.addEntity({
      type: modelForeignRelationEntityType,
      idPath: 'foreignId',
      getNameResolver: (entity) => entity.foreignRelationName,
      parentPath: 'modelRef',
    });
  },
);

export type ModelRelationFieldConfig = z.infer<typeof modelRelationFieldSchema>;

export type ModelRelationFieldConfigInput = z.input<
  typeof modelRelationFieldSchema
>;

export const modelUniqueConstraintSchema = zEnt(
  z.object({
    fields: z.array(
      z.object({
        fieldRef: zRef(z.string().min(1), {
          type: modelScalarFieldEntityType,
          onDelete: 'RESTRICT',
          parentPath: { context: 'model' },
        }),
      }),
    ),
  }),
  {
    type: modelUniqueConstraintEntityType,
    parentPath: { context: 'model' },
    getNameResolver(value) {
      return createDefinitionEntityNameResolver({
        idsToResolve: { fields: value.fields.map((f) => f.fieldRef) },
        resolveName: (entityNames) => entityNames.fields.join('_'),
      });
    },
  },
);

export type ModelUniqueConstraintConfig = z.infer<
  typeof modelUniqueConstraintSchema
>;

export type ModelUniqueConstraintConfigInput = z.input<
  typeof modelUniqueConstraintSchema
>;

export const modelServiceSchema = z.object({
  create: z
    .object({
      enabled: z.boolean().default(false),
      fields: z
        .array(
          zRef(z.string(), {
            type: modelScalarFieldEntityType,
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
    .default({ enabled: false }),
  update: z
    .object({
      enabled: z.boolean().default(false),
      fields: z
        .array(
          zRef(z.string(), {
            type: modelScalarFieldEntityType,
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
    .default({ enabled: false }),
  delete: z
    .object({
      enabled: z.boolean().default(false),
    })
    .default({
      enabled: false,
    }),
  transformers: z.array(transformerSchema).default([]),
});

export type ModelServiceConfig = z.infer<typeof modelServiceSchema>;

export const modelBaseSchema = z.object({
  id: zRefId,
  name: VALIDATORS.PASCAL_CASE_STRING,
  featureRef: zRef(z.string().min(1), {
    type: featureEntityType,
    onDelete: 'RESTRICT',
  }),
  model: z.object({
    fields: z.array(modelScalarFieldSchema),
    relations: z.array(modelRelationFieldSchema).optional(),
    primaryKeyFieldRefs: z
      .array(
        zRef(z.string(), {
          type: modelScalarFieldEntityType,
          onDelete: 'RESTRICT',
          parentPath: { context: 'model' },
        }),
      )
      .min(1),
    uniqueConstraints: z.array(modelUniqueConstraintSchema).optional(),
  }),
  service: modelServiceSchema.default({
    create: { enabled: false },
    update: { enabled: false },
    delete: { enabled: false },
    transformers: [],
  }),
  graphql: modelGraphqlSchema.optional(),
});

export const modelSchema = zEnt(modelBaseSchema, {
  type: modelEntityType,
  addContext: 'model',
});

export type ModelConfig = z.infer<typeof modelSchema>;

export type ModelConfigInput = z.input<typeof modelSchema>;
