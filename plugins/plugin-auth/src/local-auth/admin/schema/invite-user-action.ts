import type { def } from '@baseplate-dev/project-builder-lib';

import {
  baseAdminCrudActionSchema,
  definitionSchema,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createAdminCrudInviteUserActionSchema = definitionSchema(() =>
  baseAdminCrudActionSchema.extend({
    type: z.literal('invite-user'),
  }),
);

export type AdminCrudInviteUserActionDefinition = def.InferOutput<
  typeof createAdminCrudInviteUserActionSchema
>;
