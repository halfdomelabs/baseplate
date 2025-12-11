import { z } from 'zod';

import type { RefContextSlot } from '#src/references/ref-context-slot.js';
import type { DefinitionSchemaParserContext } from '#src/schema/creator/types.js';
import type { modelEntityType } from '#src/schema/models/types.js';

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

/** Slots required by admin crud column schemas */
export interface AdminCrudColumnSlots {
  modelSlot: RefContextSlot<typeof modelEntityType>;
}

/**
 * Schema creator for admin crud columns that requires modelSlot.
 */
export type AdminCrudColumnSchemaCreator<
  T extends AdminCrudColumnSchema = AdminCrudColumnSchema,
> = (ctx: DefinitionSchemaParserContext, slots: AdminCrudColumnSlots) => T;

export interface AdminCrudColumnType<
  T extends AdminCrudColumnSchemaCreator = AdminCrudColumnSchemaCreator,
> {
  name: string;
  createSchema: T;
}

export function createAdminCrudColumnType<
  T extends AdminCrudColumnSchemaCreator,
>(payload: AdminCrudColumnType<T>): AdminCrudColumnType<T> {
  return payload;
}

export const adminCrudColumnEntityType = createEntityType('admin-crud-column', {
  parentType: adminSectionEntityType,
});
