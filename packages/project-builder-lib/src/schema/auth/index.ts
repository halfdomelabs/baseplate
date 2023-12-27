import { z } from 'zod';

import { ReferencesBuilder } from '../references.js';
import { zRef } from '@src/references/index.js';
import { featureEntityType } from '@src/schema/features/index.js';
import { randomUid } from '@src/utils/randomUid.js';

export const authRoleSchema = z.object({
  uid: z.string().default(randomUid),
  name: z.string().min(1),
  comment: z.string().min(1),
  inherits: z.array(z.string().min(1)).optional(),
});

export type AuthRoleConfig = z.infer<typeof authRoleSchema>;

export const AUTH_DEFAULT_ROLES = [
  {
    name: 'anonymous',
    comment: 'Anonymous role for unauthenticated users',
    inherits: [],
  },
  {
    name: 'user',
    comment: 'Role for authenticated users',
    inherits: ['anonymous'],
  },
  {
    name: 'system',
    comment: 'Role for jobs/tests without a user',
  },
];

export const authSchema = z.object({
  userModel: z.string().min(1),
  userRoleModel: z.string().min(1).optional(),
  useAuth0: z.boolean().default(false),
  authFeaturePath: zRef(z.string().min(1), {
    type: featureEntityType,
    onDelete: 'RESTRICT',
  }),
  accountsFeaturePath: zRef(z.string().min(1), {
    type: featureEntityType,
    onDelete: 'RESTRICT',
  }),
  passwordProvider: z.boolean().optional(),
  roles: z.array(authRoleSchema).refine(
    (roles) =>
      // TODO: Add system role
      ['anonymous', 'user'].every(
        (name) => roles?.some((r) => r.name === name),
      ),
    { message: 'Anonymous, user, system role required' },
  ),
});

export type AuthConfig = z.infer<typeof authSchema>;

export function buildAuthReferences(
  config: AuthConfig,
  builder: ReferencesBuilder<AuthConfig>,
): void {
  config.roles.forEach((role) => {
    builder.addReferenceable({
      category: 'role',
      id: role.uid,
      name: role.name,
    });
  });

  builder
    .addReference('userModel', { category: 'model' })
    .addReference('userRoleModel', { category: 'model' });
}
