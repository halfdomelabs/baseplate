import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

// For now, define our own base schema since it's not exported
const baseAdminCrudColumnSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  label: z.string().min(1),
});

export const createAdminCrudRolesColumnSchema = definitionSchema(() =>
  baseAdminCrudColumnSchema.extend({
    type: z.literal('roles'),
  }),
);

export type AdminCrudRolesColumnDefinition = def.InferInput<
  typeof createAdminCrudRolesColumnSchema
>;
