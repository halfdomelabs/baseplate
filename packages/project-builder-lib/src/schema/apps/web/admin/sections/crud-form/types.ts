import { z } from 'zod';

import type { DefinitionSchemaCreator } from '#src/schema/creator/types.js';

import { createEntityType } from '#src/references/types.js';

import { adminSectionEntityType } from '../types.js';

export const baseAdminCrudInputSchema = z.object({
  id: z
    .string()
    .min(1)
    .default(() => adminCrudInputEntityType.generateNewId()),
  type: z.string().min(1),
  label: z.string().min(1),
});

export type AdminCrudInputInput = z.input<typeof baseAdminCrudInputSchema>;

export type AdminCrudInputDefinition = z.infer<typeof baseAdminCrudInputSchema>;

export interface AdminCrudInputType<
  T extends DefinitionSchemaCreator = DefinitionSchemaCreator,
> {
  name: string;
  createSchema: T;
}

export function createAdminCrudInputType<T extends DefinitionSchemaCreator>(
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
