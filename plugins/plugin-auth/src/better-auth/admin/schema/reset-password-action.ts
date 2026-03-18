import type { def } from '@baseplate-dev/project-builder-lib';

import {
  baseAdminCrudActionSchema,
  definitionSchema,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createAdminCrudResetPasswordActionSchema = definitionSchema(() =>
  baseAdminCrudActionSchema.extend({
    type: z.literal('reset-password'),
  }),
);

export type AdminCrudResetPasswordActionDefinition = def.InferOutput<
  typeof createAdminCrudResetPasswordActionSchema
>;
