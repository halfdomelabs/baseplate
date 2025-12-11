import { z } from 'zod';

import type { RefContextSlot } from '#src/references/ref-context-slot.js';
import type { DefinitionSchemaParserContext } from '#src/schema/creator/types.js';
import type { modelEntityType } from '#src/schema/models/types.js';

import { createEntityType } from '#src/references/types.js';

import { adminSectionEntityType } from '../types.js';

export const baseAdminCrudInputSchema = z.looseObject({
  id: z
    .string()
    .min(1)
    .default(() => adminCrudInputEntityType.generateNewId()),
  type: z.string().min(1),
  label: z.string().min(1),
});

export type AdminCrudInputInput = z.input<typeof baseAdminCrudInputSchema>;

export type AdminCrudInputDefinition = z.infer<typeof baseAdminCrudInputSchema>;

export type AdminCrudInputSchema = z.ZodType<
  AdminCrudInputDefinition,
  AdminCrudInputInput
>;

/** Slots required by admin crud input schemas */
export interface AdminCrudInputSlots {
  modelSlot: RefContextSlot<typeof modelEntityType>;
  adminSectionSlot: RefContextSlot<typeof adminSectionEntityType>;
}

/**
 * Schema creator for admin crud inputs that requires modelSlot and adminSectionSlot.
 */
export type AdminCrudInputSchemaCreator<
  T extends AdminCrudInputSchema = AdminCrudInputSchema,
> = (ctx: DefinitionSchemaParserContext, slots: AdminCrudInputSlots) => T;

export interface AdminCrudInputType<
  T extends AdminCrudInputSchemaCreator = AdminCrudInputSchemaCreator,
> {
  name: string;
  createSchema: T;
}

export function createAdminCrudInputType<T extends AdminCrudInputSchemaCreator>(
  payload: AdminCrudInputType<T>,
): AdminCrudInputType<T> {
  return payload;
}

export const adminCrudEmbeddedFormEntityType = createEntityType(
  'admin-crud-embedded-form',
  {
    parentType: adminSectionEntityType,
  },
);

export const adminCrudInputEntityType = createEntityType('admin-crud-input', {
  parentType: adminSectionEntityType,
});
