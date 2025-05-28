import {
  featureEntityType,
  modelEntityType,
  zRef,
} from '@halfdomelabs/project-builder-lib';
import { z } from 'zod';

import { authRolesSchema } from '@src/roles';

export const authPluginDefinitionSchema = z.object({
  modelRefs: z.object({
    user: zRef(z.string().min(1), {
      type: modelEntityType,
      onDelete: 'RESTRICT',
    }),
    userAccount: zRef(z.string().min(1), {
      type: modelEntityType,
      onDelete: 'RESTRICT',
    }),
    userRole: zRef(z.string().min(1), {
      type: modelEntityType,
      onDelete: 'RESTRICT',
    }),
    userSession: zRef(z.string().min(1), {
      type: modelEntityType,
      onDelete: 'RESTRICT',
    }),
  }),
  authFeatureRef: zRef(z.string().min(1), {
    type: featureEntityType,
    onDelete: 'RESTRICT',
  }),
  roles: authRolesSchema,
});

export type AuthPluginDefinition = z.infer<typeof authPluginDefinitionSchema>;

export type AuthPluginDefinitionInput = z.input<
  typeof authPluginDefinitionSchema
>;
