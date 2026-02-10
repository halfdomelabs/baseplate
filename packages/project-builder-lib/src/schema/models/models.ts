import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { createDefinitionEntityNameResolver } from '#src/references/index.js';
import {
  definitionSchema,
  definitionSchemaWithSlots,
} from '#src/schema/creator/schema-creator.js';
import { SCALAR_FIELD_TYPES } from '#src/types/field-types.js';

import { featureEntityType } from '../features/index.js';
import { VALIDATORS } from '../utils/validation.js';
import { createModelAuthorizerSchema } from './authorizer/authorizer.js';
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

export const createModelScalarFieldSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType },
  (ctx, { modelSlot }) =>
    ctx
      .withEnt(
        z.object({
          id: z.string(),
          name: VALIDATORS.CAMEL_CASE_STRING,
          type: z.enum(SCALAR_FIELD_TYPES),
          isOptional: z.boolean().default(false),
          options: ctx.refContext(
            { enumSlot: modelEnumEntityType },
            ({ enumSlot }) =>
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
                  enumRef: ctx
                    .withRef({
                      type: modelEnumEntityType,
                      onDelete: 'RESTRICT',
                      provides: enumSlot,
                    })
                    .optional(),
                  defaultEnumValueRef: ctx
                    .withRef({
                      type: modelEnumValueEntityType,
                      onDelete: 'RESTRICT',
                      parentSlot: enumSlot,
                    })
                    .optional(),
                })
                .transform((val) => ({
                  ...val,
                  ...(val.enumRef ? {} : { defaultEnumValueRef: undefined }),
                }))
                .prefault({}),
          ),
        }),
        {
          type: modelScalarFieldEntityType,
          parentSlot: modelSlot,
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

export const createModelRelationFieldSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType },
  (ctx, { modelSlot }) =>
    ctx.refContext(
      { foreignModelSlot: modelEntityType },
      ({ foreignModelSlot }) =>
        ctx.withEnt(
          ctx.withEnt(
            z.object({
              id: z.string(),
              foreignId: z
                .string()
                .default(() => modelForeignRelationEntityType.generateNewId()),
              name: VALIDATORS.CAMEL_CASE_STRING,
              references: z.array(
                z.object({
                  localRef: ctx.withRef({
                    type: modelScalarFieldEntityType,
                    onDelete: 'RESTRICT',
                    parentSlot: modelSlot,
                  }),
                  foreignRef: ctx.withRef({
                    type: modelScalarFieldEntityType,
                    onDelete: 'RESTRICT',
                    parentSlot: foreignModelSlot,
                  }),
                }),
              ),
              modelRef: ctx.withRef({
                type: modelEntityType,
                onDelete: 'RESTRICT',
                provides: foreignModelSlot,
              }),
              foreignRelationName: VALIDATORS.CAMEL_CASE_STRING,
              onDelete: z.enum(REFERENTIAL_ACTIONS).default('Cascade'),
              onUpdate: z.enum(REFERENTIAL_ACTIONS).default('Restrict'),
            }),
            {
              type: modelLocalRelationEntityType,
              parentSlot: modelSlot,
            },
          ),
          {
            type: modelForeignRelationEntityType,
            idPath: ['foreignId'],
            getNameResolver: (entity) => entity.foreignRelationName,
            parentSlot: foreignModelSlot,
          },
        ),
    ),
);

export type ModelRelationFieldConfig = def.InferOutput<
  typeof createModelRelationFieldSchema
>;

export type ModelRelationFieldConfigInput = def.InferInput<
  typeof createModelRelationFieldSchema
>;

export const createModelUniqueConstraintSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType },
  (ctx, { modelSlot }) =>
    ctx.withEnt(
      z.object({
        id: z.string(),
        fields: z.array(
          z.object({
            fieldRef: ctx.withRef({
              type: modelScalarFieldEntityType,
              onDelete: 'RESTRICT',
              parentSlot: modelSlot,
            }),
          }),
        ),
      }),
      {
        type: modelUniqueConstraintEntityType,
        parentSlot: modelSlot,
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

export const createModelServiceSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType },
  (ctx, { modelSlot }) =>
    z.object({
      create: z
        .object({
          enabled: z.boolean().default(false),
          fields: z
            .array(
              ctx.withRef({
                type: modelScalarFieldEntityType,
                onDelete: 'DELETE',
                parentSlot: modelSlot,
              }),
            )
            .optional(),
          transformerNames: z
            .array(
              ctx.withRef({
                type: modelTransformerEntityType,
                onDelete: 'DELETE',
                parentSlot: modelSlot,
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
              ctx.withRef({
                type: modelScalarFieldEntityType,
                onDelete: 'DELETE',
                parentSlot: modelSlot,
              }),
            )
            .optional(),
          transformerNames: z
            .array(
              ctx.withRef({
                type: modelTransformerEntityType,
                onDelete: 'DELETE',
                parentSlot: modelSlot,
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
      transformers: z
        .array(createTransformerSchema(ctx, { modelSlot }))
        .default([]),
    }),
);

export type ModelServiceConfig = def.InferOutput<
  typeof createModelServiceSchema
>;

export const createModelBaseSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType },
  (ctx, slots) =>
    z.object({
      id: z.string(),
      name: VALIDATORS.PASCAL_CASE_STRING,
      featureRef: ctx.withRef({
        type: featureEntityType,
        onDelete: 'RESTRICT',
      }),
      model: z.object({
        fields: z.array(createModelScalarFieldSchema(ctx, slots)),
        relations: z
          .array(createModelRelationFieldSchema(ctx, slots))
          .optional(),
        primaryKeyFieldRefs: z
          .array(
            ctx.withRef({
              type: modelScalarFieldEntityType,
              onDelete: 'RESTRICT',
              parentSlot: slots.modelSlot,
            }),
          )
          .min(1),
        uniqueConstraints: z
          .array(createModelUniqueConstraintSchema(ctx, slots))
          .optional(),
      }),
      service: createModelServiceSchema(ctx, slots).default({
        create: { enabled: false },
        update: { enabled: false },
        delete: { enabled: false },
        transformers: [],
      }),
      graphql: ctx.withDefault(
        createModelGraphqlSchema(ctx, slots).optional(),
        {},
      ),
      authorizer: ctx.withDefault(
        createModelAuthorizerSchema(ctx, slots).optional(),
        { roles: [] },
      ),
    }),
);

export const createModelSchema = definitionSchema((ctx) =>
  ctx.refContext({ modelSlot: modelEntityType }, ({ modelSlot }) =>
    ctx.withEnt(createModelBaseSchema(ctx, { modelSlot }), {
      type: modelEntityType,
      provides: modelSlot,
    }),
  ),
);

export type ModelConfig = def.InferOutput<typeof createModelSchema>;

export type ModelConfigInput = def.InferInput<typeof createModelSchema>;
