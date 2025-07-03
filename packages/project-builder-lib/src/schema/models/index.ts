import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { createDefinitionEntityNameResolver } from '#src/references/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';
import { SCALAR_FIELD_TYPES } from '#src/types/field-types.js';

import { featureEntityType } from '../features/index.js';
import { VALIDATORS } from '../utils/validation.js';
import { createModelGraphqlSchema } from './graphql.js';
import { createTransformerSchema } from './transformers/transformers.js';
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

export const createModelScalarFieldSchema = definitionSchema((ctx) =>
  ctx
    .withEnt(
      z.object({
        id: z.string(),
        name: VALIDATORS.CAMEL_CASE_STRING,
        type: z.enum(SCALAR_FIELD_TYPES),
        isOptional: z.boolean().default(false),
        options: ctx.withRefBuilder(
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
              enumRef: ctx.withRef(z.string().optional(), {
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
    }),
);

export type ModelScalarFieldConfig = def.InferOutput<
  typeof createModelScalarFieldSchema
>;

export type ModelScalarFieldConfigInput = def.InferInput<
  typeof createModelScalarFieldSchema
>;

export const REFERENTIAL_ACTIONS = [
  'Cascade',
  'Restrict',
  'NoAction',
  'SetNull',
  'SetDefault',
] as const;

export const createModelRelationFieldSchema = definitionSchema((ctx) =>
  ctx.withRefBuilder(
    z.object({
      id: z.string(),
      foreignId: z
        .string()
        .default(() => modelForeignRelationEntityType.generateNewId()),
      name: VALIDATORS.CAMEL_CASE_STRING,
      references: z.array(
        z.object({
          localRef: ctx.withRef(z.string(), {
            type: modelScalarFieldEntityType,
            onDelete: 'RESTRICT',
            parentPath: { context: 'model' },
          }),
          foreignRef: ctx.withRef(z.string(), {
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
  ),
);

export type ModelRelationFieldConfig = def.InferOutput<
  typeof createModelRelationFieldSchema
>;

export type ModelRelationFieldConfigInput = def.InferInput<
  typeof createModelRelationFieldSchema
>;

export const createModelUniqueConstraintSchema = definitionSchema((ctx) =>
  ctx.withEnt(
    z.object({
      id: z.string(),
      fields: z.array(
        z.object({
          fieldRef: ctx.withRef(z.string().min(1), {
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
  ),
);

export type ModelUniqueConstraintConfig = def.InferOutput<
  typeof createModelUniqueConstraintSchema
>;

export type ModelUniqueConstraintConfigInput = def.InferInput<
  typeof createModelUniqueConstraintSchema
>;

export const createModelServiceSchema = definitionSchema((ctx) =>
  z.object({
    create: z
      .object({
        enabled: z.boolean().default(false),
        fields: z
          .array(
            ctx.withRef(z.string(), {
              type: modelScalarFieldEntityType,
              onDelete: 'DELETE',
              parentPath: { context: 'model' },
            }),
          )
          .optional(),
        transformerNames: z
          .array(
            ctx.withRef(z.string(), {
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
            ctx.withRef(z.string(), {
              type: modelScalarFieldEntityType,
              onDelete: 'DELETE',
              parentPath: { context: 'model' },
            }),
          )
          .optional(),
        transformerNames: z
          .array(
            ctx.withRef(z.string(), {
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
    transformers: z.array(createTransformerSchema(ctx)).default([]),
  }),
);

export type ModelServiceConfig = def.InferOutput<
  typeof createModelServiceSchema
>;

export const createModelBaseSchema = definitionSchema((ctx) =>
  z.object({
    id: z.string(),
    name: VALIDATORS.PASCAL_CASE_STRING,
    featureRef: ctx.withRef(z.string().min(1), {
      type: featureEntityType,
      onDelete: 'RESTRICT',
    }),
    model: z.object({
      fields: z.array(createModelScalarFieldSchema(ctx)),
      relations: z.array(createModelRelationFieldSchema(ctx)).optional(),
      primaryKeyFieldRefs: z
        .array(
          ctx.withRef(z.string(), {
            type: modelScalarFieldEntityType,
            onDelete: 'RESTRICT',
            parentPath: { context: 'model' },
          }),
        )
        .min(1),
      uniqueConstraints: z
        .array(createModelUniqueConstraintSchema(ctx))
        .optional(),
    }),
    service: createModelServiceSchema(ctx).default({
      create: { enabled: false },
      update: { enabled: false },
      delete: { enabled: false },
      transformers: [],
    }),
    graphql: createModelGraphqlSchema(ctx).optional(),
  }),
);

export const createModelSchema = definitionSchema((ctx) =>
  ctx.withEnt(createModelBaseSchema(ctx), {
    type: modelEntityType,
    addContext: 'model',
  }),
);

export type ModelConfig = def.InferOutput<typeof createModelSchema>;

export type ModelConfigInput = def.InferInput<typeof createModelSchema>;
