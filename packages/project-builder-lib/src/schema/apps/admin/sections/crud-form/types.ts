import { z } from 'zod';

import { createEntityType } from '@src/references/types.js';

import { adminSectionEntityType } from '../types.js';

export const baseAdminCrudInputSchema = z.object({
  type: z.string().min(1),
  label: z.string().min(1),
});

export type AdminCrudInputDefinition = z.infer<typeof baseAdminCrudInputSchema>;

export interface AdminCrudInputType<T extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  schema: T;
}

export function createAdminCrudInputType<T extends z.ZodTypeAny>(
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
