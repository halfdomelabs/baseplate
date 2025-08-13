import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';
import {
  modelEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '#src/schema/models/index.js';

import { createBaseAdminSectionValidators } from './base.js';
import { createAdminCrudInputSchema } from './crud-form/admin-crud-input.js';
import { adminCrudEmbeddedFormEntityType } from './crud-form/types.js';
import { adminCrudSectionColumnEntityType } from './types.js';

// Table Columns
export const createAdminCrudForeignDisplaySchema = definitionSchema((ctx) =>
  z.object({
    type: z.literal('foreign'),
    localRelationRef: ctx.withRef({
      type: modelLocalRelationEntityType,
      onDelete: 'RESTRICT',
      parentPath: { context: 'model' },
    }),
    labelExpression: z.string().min(1),
    valueExpression: z.string().min(1),
  }),
);

export type AdminCrudForeignDisplayConfig = def.InferOutput<
  typeof createAdminCrudForeignDisplaySchema
>;

export const createAdminCrudTextDisplaySchema = definitionSchema((ctx) =>
  z.object({
    type: z.literal('text'),
    modelFieldRef: ctx.withRef({
      type: modelScalarFieldEntityType,
      onDelete: 'RESTRICT',
      parentPath: { context: 'model' },
    }),
  }),
);

export type AdminCrudTextDisplayConfig = def.InferOutput<
  typeof createAdminCrudTextDisplaySchema
>;

export const createAdminCrudDisplaySchema = definitionSchema((ctx) =>
  z.discriminatedUnion('type', [
    createAdminCrudTextDisplaySchema(ctx),
    createAdminCrudForeignDisplaySchema(ctx),
  ]),
);

// TODO: Improve this to be more dynamic in the future
export const adminCrudDisplayTypes = ['text', 'foreign'] as const;

export type AdminCrudDisplayConfig = def.InferOutput<
  typeof createAdminCrudDisplaySchema
>;

export const createAdminCrudTableColumnSchema = definitionSchema((ctx) =>
  ctx.withEnt(
    z.object({
      id: z
        .string()
        .default(() => adminCrudSectionColumnEntityType.generateNewId()),
      label: z.string().min(1),
      display: createAdminCrudDisplaySchema(ctx),
    }),
    {
      type: adminCrudSectionColumnEntityType,
      parentPath: {
        context: 'admin-section',
      },
      getNameResolver: (value) => value.id ?? '',
    },
  ),
);

export type AdminCrudTableColumnDefinition = def.InferOutput<
  typeof createAdminCrudTableColumnSchema
>;

export type AdminCrudTableColumnDefinitionInput = def.InferInput<
  typeof createAdminCrudTableColumnSchema
>;

// Embedded Crud
export const createAdminCrudEmbeddedObjectSchema = definitionSchema((ctx) =>
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    modelRef: ctx.withRef({
      type: modelEntityType,
      onDelete: 'RESTRICT',
    }),
    includeIdField: z.boolean().optional(),
    type: z.literal('object'),
    form: z.object({
      fields: z.array(createAdminCrudInputSchema(ctx)),
    }),
  }),
);

export const createAdminCrudEmbeddedListSchema = definitionSchema((ctx) =>
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    modelRef: ctx.withRef({
      type: modelEntityType,
      onDelete: 'RESTRICT',
    }),
    includeIdField: z.boolean().optional(),
    type: z.literal('list'),
    // NOTE: These two fields need to be synced with crud section schema
    // because the web app expects that (TODO)
    table: z.object({
      columns: z.array(createAdminCrudTableColumnSchema(ctx)),
    }),
    form: z.object({
      fields: z.array(createAdminCrudInputSchema(ctx)),
    }),
  }),
);

export const createAdminCrudEmbeddedFormSchema = definitionSchema((ctx) =>
  ctx.withRefBuilder(
    z.discriminatedUnion('type', [
      createAdminCrudEmbeddedObjectSchema(ctx),
      createAdminCrudEmbeddedListSchema(ctx),
    ]),
    (builder) => {
      builder.addEntity({
        type: adminCrudEmbeddedFormEntityType,
        parentPath: { context: 'admin-section' },
      });
      builder.addPathToContext('modelRef', modelEntityType, 'model');
    },
  ),
);

export type AdminCrudEmbeddedFormConfig = def.InferOutput<
  typeof createAdminCrudEmbeddedFormSchema
>;

export type AdminCrudEmbeddedFormConfigInput = def.InferInput<
  typeof createAdminCrudEmbeddedFormSchema
>;

// Admin Section

export const createAdminCrudSectionSchema = definitionSchema((ctx) =>
  ctx.withRefBuilder(
    createBaseAdminSectionValidators(ctx).and(
      z.object({
        type: z.literal('crud'),
        modelRef: ctx.withRef({
          type: modelEntityType,
          onDelete: 'RESTRICT',
        }),
        /* The field that will be used to display the name of the entity in the form */
        nameFieldRef: ctx.withDefault(
          ctx
            .withRef({
              type: modelScalarFieldEntityType,
              onDelete: 'RESTRICT',
              parentPath: {
                context: 'modelRef',
              },
            })
            .nullable(),
          null,
        ),
        disableCreate: ctx.withDefault(z.boolean(), false),
        table: z.object({
          columns: z.array(createAdminCrudTableColumnSchema(ctx)),
        }),
        form: z.object({
          fields: z.array(createAdminCrudInputSchema(ctx)),
        }),
        embeddedForms: z
          .array(createAdminCrudEmbeddedFormSchema(ctx))
          .optional(),
      }),
    ),
    (builder) => {
      builder.addPathToContext('modelRef', modelEntityType, 'model');
    },
  ),
);

export type AdminCrudSectionConfig = def.InferOutput<
  typeof createAdminCrudSectionSchema
>;

export type AdminCrudSectionConfigInput = def.InferInput<
  typeof createAdminCrudSectionSchema
>;
