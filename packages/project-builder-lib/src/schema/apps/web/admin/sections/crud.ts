import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchema } from '#src/schema/creator/schema-creator.js';
import {
  modelEntityType,
  modelScalarFieldEntityType,
} from '#src/schema/models/index.js';

import { createBaseAdminSectionValidators } from './base.js';
import { createAdminCrudActionSchema } from './crud-actions/admin-crud-action.js';
import { createAdminCrudColumnSchema } from './crud-columns/admin-crud-column.js';
import { createAdminCrudInputSchema } from './crud-form/admin-crud-input.js';
import { adminCrudEmbeddedFormEntityType } from './crud-form/types.js';

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
    table: z.object({
      columns: z.array(createAdminCrudColumnSchema(ctx)),
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
        nameFieldRef: ctx.withRef({
          type: modelScalarFieldEntityType,
          onDelete: 'RESTRICT',
          parentPath: {
            context: 'model',
          },
        }),
        disableCreate: ctx.withDefault(z.boolean(), false),
        table: z.object({
          columns: z.array(createAdminCrudColumnSchema(ctx)),
          actions: ctx.withDefault(z.array(createAdminCrudActionSchema(ctx)), [
            { type: 'edit', position: 'inline' },
            { type: 'delete', position: 'dropdown' },
          ]),
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
