import { z } from 'zod';

import { zRef } from '@src/references/index.js';
import {
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '@src/schema/models/index.js';

import type { AdminCrudInputType } from './types.js';

import {
  adminCrudEmbeddedFormEntityType,
  createAdminCrudInputType,
} from './types.js';

export const adminCrudTextInputSchema = z.object({
  type: z.literal('text'),
  label: z.string().min(1),
  modelFieldRef: zRef(z.string(), {
    type: modelScalarFieldEntityType,
    onDelete: 'RESTRICT',
    parentPath: { context: 'model' },
  }),
  validation: z.string().optional(),
});

export type AdminCrudTextInputConfig = z.infer<typeof adminCrudTextInputSchema>;

const adminCrudTextInputType = createAdminCrudInputType({
  name: 'text',
  schema: adminCrudTextInputSchema,
});

export const adminCrudForeignInputSchema = z.object({
  type: z.literal('foreign'),
  label: z.string().min(1),
  localRelationRef: zRef(z.string(), {
    type: modelLocalRelationEntityType,
    onDelete: 'RESTRICT',
    parentPath: { context: 'model' },
  }),
  labelExpression: z.string().min(1),
  valueExpression: z.string().min(1),
  defaultLabel: z.string().optional(),
  nullLabel: z.string().optional(),
});

export type AdminCrudForeignInputConfig = z.infer<
  typeof adminCrudForeignInputSchema
>;

const adminCrudForeignInputType = createAdminCrudInputType({
  name: 'foreign',
  schema: adminCrudForeignInputSchema,
});

export const adminCrudEnumInputSchema = z.object({
  type: z.literal('enum'),
  label: z.string().min(1),
  modelFieldRef: zRef(z.string(), {
    type: modelScalarFieldEntityType,
    onDelete: 'RESTRICT',
    parentPath: { context: 'model' },
  }),
});

export type AdminCrudEnumInputConfig = z.infer<typeof adminCrudEnumInputSchema>;

const adminCrudEnumInputType = createAdminCrudInputType({
  name: 'enum',
  schema: adminCrudEnumInputSchema,
});

export const adminCrudEmbeddedInputSchema = z.object({
  type: z.literal('embedded'),
  label: z.string().min(1),
  modelRelationRef: zRef(z.string(), {
    type: modelForeignRelationEntityType,
    onDelete: 'RESTRICT',
    parentPath: { context: 'model' },
  }),
  embeddedFormRef: zRef(z.string(), {
    type: adminCrudEmbeddedFormEntityType,
    parentPath: { context: 'admin-section' },
    onDelete: 'RESTRICT',
  }),
});

export type AdminCrudEmbeddedInputConfig = z.infer<
  typeof adminCrudEmbeddedInputSchema
>;

export const adminCrudEmbeddedInputType = createAdminCrudInputType({
  name: 'embedded',
  schema: adminCrudEmbeddedInputSchema,
});

export const adminCrudEmbeddedLocalInputSchema = z.object({
  type: z.literal('embeddedLocal'),
  label: z.string().min(1),
  localRelationRef: zRef(z.string(), {
    type: modelLocalRelationEntityType,
    onDelete: 'RESTRICT',
    parentPath: { context: 'model' },
  }),
  embeddedFormRef: zRef(z.string(), {
    type: adminCrudEmbeddedFormEntityType,
    parentPath: { context: 'admin-section' },
    onDelete: 'RESTRICT',
  }),
});

export type AdminCrudEmbeddedLocalInputConfig = z.infer<
  typeof adminCrudEmbeddedLocalInputSchema
>;

export const adminCrudEmbeddedLocalInputType = createAdminCrudInputType({
  name: 'embeddedLocal',
  schema: adminCrudEmbeddedLocalInputSchema,
});

export const adminCrudPasswordInputSchema = z.object({
  type: z.literal('password'),
  label: z.string().min(1),
});

export type AdminCrudPasswordInputConfig = z.infer<
  typeof adminCrudPasswordInputSchema
>;

const adminCrudPasswordInputType = createAdminCrudInputType({
  name: 'password',
  schema: adminCrudPasswordInputSchema,
});

export const BUILT_IN_ADMIN_CRUD_INPUTS: AdminCrudInputType[] = [
  adminCrudTextInputType,
  adminCrudForeignInputType,
  adminCrudEnumInputType,
  adminCrudEmbeddedInputType,
  adminCrudEmbeddedLocalInputType,
  adminCrudPasswordInputType,
];
