import { z } from 'zod';

import type { def } from '#src/schema/creator/index.js';

import { definitionSchemaWithSlots } from '#src/schema/creator/schema-creator.js';
import {
  modelEntityType,
  modelScalarFieldEntityType,
} from '#src/schema/models/index.js';

import { createBaseAdminSectionValidators } from './base.js';
import { createAdminCrudActionSchema } from './crud-actions/admin-crud-action.js';
import { createAdminCrudColumnSchema } from './crud-columns/admin-crud-column.js';
import { createAdminCrudInputSchema } from './crud-form/admin-crud-input.js';
import { adminCrudEmbeddedFormEntityType } from './crud-form/types.js';
import { adminSectionEntityType } from './types.js';

// Embedded Crud
const createAdminCrudEmbeddedObjectSchemaInternal = definitionSchemaWithSlots(
  { modelSlot: modelEntityType, adminSectionSlot: adminSectionEntityType },
  (ctx, { modelSlot, adminSectionSlot }) =>
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
        fields: z.array(
          createAdminCrudInputSchema(ctx, { modelSlot, adminSectionSlot }),
        ),
      }),
    }),
);

const createAdminCrudEmbeddedListSchemaInternal = definitionSchemaWithSlots(
  { modelSlot: modelEntityType, adminSectionSlot: adminSectionEntityType },
  (ctx, { modelSlot, adminSectionSlot }) =>
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
        columns: z.array(createAdminCrudColumnSchema(ctx, { modelSlot })),
      }),
      form: z.object({
        fields: z.array(
          createAdminCrudInputSchema(ctx, { modelSlot, adminSectionSlot }),
        ),
      }),
    }),
);

export const createAdminCrudEmbeddedFormSchema = definitionSchemaWithSlots(
  { adminSectionSlot: adminSectionEntityType },
  (ctx, { adminSectionSlot }) =>
    ctx.refContext({ modelSlot: modelEntityType }, ({ modelSlot }) =>
      ctx.withRefBuilder(
        z.discriminatedUnion('type', [
          createAdminCrudEmbeddedObjectSchemaInternal(ctx, {
            modelSlot,
            adminSectionSlot,
          }),
          createAdminCrudEmbeddedListSchemaInternal(ctx, {
            modelSlot,
            adminSectionSlot,
          }),
        ]),
        (builder) => {
          builder.addEntity({
            type: adminCrudEmbeddedFormEntityType,
            parentRef: adminSectionSlot,
          });
          builder.addPathToContext('modelRef', modelSlot);
        },
      ),
    ),
);

export type AdminCrudEmbeddedFormConfig = def.InferOutput<
  typeof createAdminCrudEmbeddedFormSchema
>;

export type AdminCrudEmbeddedFormConfigInput = def.InferInput<
  typeof createAdminCrudEmbeddedFormSchema
>;

// Admin Section

export const createAdminCrudSectionSchema = definitionSchemaWithSlots(
  { adminSectionSlot: adminSectionEntityType },
  (ctx, { adminSectionSlot }) =>
    ctx.refContext({ modelSlot: modelEntityType }, ({ modelSlot }) =>
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
              parentRef: modelSlot,
            }),
            disableCreate: ctx.withDefault(z.boolean(), false),
            table: z.object({
              columns: z.array(createAdminCrudColumnSchema(ctx, { modelSlot })),
              actions: ctx.withDefault(
                z.array(createAdminCrudActionSchema(ctx)),
                [
                  { type: 'edit', position: 'inline' },
                  { type: 'delete', position: 'dropdown' },
                ],
              ),
            }),
            form: z.object({
              fields: z.array(
                createAdminCrudInputSchema(ctx, {
                  modelSlot,
                  adminSectionSlot,
                }),
              ),
            }),
            embeddedForms: z
              .array(
                createAdminCrudEmbeddedFormSchema(ctx, { adminSectionSlot }),
              )
              .optional(),
          }),
        ),
        (builder) => {
          builder.addPathToContext('modelRef', modelSlot);
        },
      ),
    ),
);

export type AdminCrudSectionConfig = def.InferOutput<
  typeof createAdminCrudSectionSchema
>;

export type AdminCrudSectionConfigInput = def.InferInput<
  typeof createAdminCrudSectionSchema
>;
