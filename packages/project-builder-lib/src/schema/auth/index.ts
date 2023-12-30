import { z } from 'zod';

import { authRoleEntityType } from './types.js';
import { modelEntityType } from '../models/index.js';
import { zEnt, zRef } from '@src/references/index.js';
import { featureEntityType } from '@src/schema/features/index.js';

export * from './types.js';

export const authRoleSchema = zEnt(
  z.object({
    name: z.string().min(1),
    comment: z.string().min(1),
    inherits: z
      .array(
        zRef(z.string(), {
          type: authRoleEntityType,
          onDelete: 'RESTRICT',
        }),
      )
      .optional(),
  }),
  { type: authRoleEntityType },
);

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
  userModel: zRef(z.string().min(1), {
    type: modelEntityType,
    onDelete: 'RESTRICT',
  }),
  userRoleModel: zRef(z.string().min(1), {
    type: modelEntityType,
    onDelete: 'RESTRICT',
  }),
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
