import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { createDefinitionEntityNameResolver } from '#src/references/index.js';
import {
  definitionSchema,
  definitionSchemaWithSlots,
} from '#src/schema/creator/schema-creator.js';

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
  (ctx, { modelSlot }) => {
    const commonFields = {
      id: z.string(),
      name: VALIDATORS.CAMEL_CASE_STRING,
      isOptional: z.boolean().default(false),
    };

    const defaultOptionsSchema = z
      .object({ default: z.string().optional() })
      .default({});

    const union = z.discriminatedUnion('type', [
      z.object({
        ...commonFields,
        type: z.literal('string'),
        options: defaultOptionsSchema,
      }),
      z.object({
        ...commonFields,
        type: z.literal('uuid'),
        options: z
          .object({
            default: z.string().optional(),
            genUuid: z.boolean().optional(),
          })
          .default({}),
      }),
      z.object({
        ...commonFields,
        type: z.literal('int'),
        options: z
          .object({
            default: z
              .string()
              .regex(/^-?\d*$/, { error: 'Default value must be a number' })
              .optional(),
          })
          .default({}),
      }),
      z.object({
        ...commonFields,
        type: z.literal('boolean'),
        options: z
          .object({ default: z.enum(['', 'true', 'false']).optional() })
          .default({}),
      }),
      z.object({
        ...commonFields,
        type: z.literal('dateTime'),
        options: z
          .object({
            defaultToNow: z.boolean().optional(),
            updatedAt: z.boolean().optional(),
          })
          .default({}),
      }),
      z.object({
        ...commonFields,
        type: z.literal('float'),
        options: defaultOptionsSchema,
      }),
      z.object({
        ...commonFields,
        type: z.literal('decimal'),
        options: z.object({ default: z.string().optional() }).default({}),
      }),
      z.object({
        ...commonFields,
        type: z.literal('json'),
        options: z.object({ default: z.string().optional() }).default({}),
      }),
      z.object({
        ...commonFields,
        type: z.literal('date'),
        options: z
          .object({
            default: z.string().optional(),
            defaultToNow: z.boolean().optional(),
          })
          .prefault({}),
      }),
      z.object({
        ...commonFields,
        type: z.literal('enum'),
        options: ctx.refContext(
          { enumSlot: modelEnumEntityType },
          ({ enumSlot }) =>
            z.object({
              enumRef: ctx.withRef({
                type: modelEnumEntityType,
                onDelete: 'RESTRICT',
                provides: enumSlot,
              }),
              defaultEnumValueRef: ctx
                .withRef({
                  type: modelEnumValueEntityType,
                  onDelete: 'RESTRICT',
                  parentSlot: enumSlot,
                })
                .optional(),
            }),
        ),
      }),
    ]);

    return ctx.withEnt(union, {
      type: modelScalarFieldEntityType,
      parentSlot: modelSlot,
    });
  },
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
