import type { def } from '@baseplate-dev/project-builder-lib';

import {
  baseAdminCrudActionSchema,
  definitionSchema,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createAdminCrudManageRolesActionSchema = definitionSchema(() =>
  baseAdminCrudActionSchema.extend({
    type: z.literal('manage-roles'),
  }),
);

export type AdminCrudManageRolesActionDefinition = def.InferOutput<
  typeof createAdminCrudManageRolesActionSchema
>;
