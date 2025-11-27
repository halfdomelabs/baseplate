import { z } from 'zod';

import type { DefinitionSchemaCreator } from '#src/schema/creator/types.js';

import { createEntityType } from '#src/references/types.js';

import { adminSectionEntityType } from '../types.js';

export const baseAdminCrudActionSchema = z.looseObject({
  id: z
    .string()
    .min(1)
    .default(() => adminCrudActionEntityType.generateNewId()),
  type: z.string().min(1),
  position: z.enum(['inline', 'dropdown']).default('dropdown'),
});

export type AdminCrudActionInput = z.input<typeof baseAdminCrudActionSchema>;

export type AdminCrudActionDefinition = z.infer<
  typeof baseAdminCrudActionSchema
>;

export interface AdminCrudActionType<
  T extends DefinitionSchemaCreator = DefinitionSchemaCreator,
> {
  name: string;
  createSchema: T;
}

export function createAdminCrudActionType<T extends DefinitionSchemaCreator>(
  payload: AdminCrudActionType<T>,
): AdminCrudActionType<T> {
  return payload;
}

export const adminCrudActionEntityType = createEntityType('admin-crud-action', {
  parentType: adminSectionEntityType,
});
