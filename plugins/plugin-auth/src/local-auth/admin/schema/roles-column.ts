import type { def } from '@baseplate-dev/project-builder-lib';

import {
  baseAdminCrudColumnSchema,
  definitionSchema,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createAdminCrudRolesColumnSchema = definitionSchema(() =>
  baseAdminCrudColumnSchema.extend({
    type: z.literal('roles'),
  }),
);

export type AdminCrudRolesColumnDefinition = def.InferOutput<
  typeof createAdminCrudRolesColumnSchema
>;
