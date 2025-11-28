import { z } from 'zod';

import type { DefinitionSchemaCreator } from '#src/schema/creator/types.js';

import { createEntityType } from '#src/references/types.js';

import { adminSectionEntityType } from '../types.js';

export const baseAdminCrudColumnSchema = z.looseObject({
  id: z
    .string()
    .min(1)
    .default(() => adminCrudColumnEntityType.generateNewId()),
  type: z.string().min(1),
  label: z.string().min(1),
});

export type AdminCrudColumnInput = z.input<typeof baseAdminCrudColumnSchema>;

export type AdminCrudColumnDefinition = z.infer<
  typeof baseAdminCrudColumnSchema
>;

export type AdminCrudColumnSchema = z.ZodType<
  AdminCrudColumnDefinition,
  AdminCrudColumnInput
>;

export interface AdminCrudColumnType<
  T extends
    DefinitionSchemaCreator<AdminCrudColumnSchema> = DefinitionSchemaCreator<AdminCrudColumnSchema>,
> {
  name: string;
  createSchema: T;
}

export function createAdminCrudColumnType<
  T extends DefinitionSchemaCreator<AdminCrudColumnSchema>,
>(payload: AdminCrudColumnType<T>): AdminCrudColumnType<T> {
  return payload;
}

export const adminCrudColumnEntityType = createEntityType('admin-crud-column', {
  parentType: adminSectionEntityType,
});
