import { z } from 'zod';

import type { DefinitionSchemaCreator } from '#src/schema/creator/types.js';

import { createEntityType } from '#src/references/types.js';

import { adminSectionEntityType } from '../types.js';

export const baseAdminCrudInputSchema = z.object({
  type: z.string().min(1),
  label: z.string().min(1),
});

export type AdminCrudInputDefinition = z.infer<typeof baseAdminCrudInputSchema>;

export interface AdminCrudInputType<
  T extends DefinitionSchemaCreator = DefinitionSchemaCreator,
> {
  name: string;
  schema: T;
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
