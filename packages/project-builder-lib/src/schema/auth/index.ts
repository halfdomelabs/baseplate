import { z } from 'zod';

import { zEnt, zRef } from '@src/references/index.js';
import { featureEntityType } from '@src/schema/features/index.js';

import { modelEntityType } from '../models/index.js';
import { authRoleEntityType } from './types.js';

export * from './types.js';

export const authRoleSchema = zEnt(
  z.object({
    name: z.string().min(1),
    comment: z.string().min(1),
    builtIn: z.boolean().default(false),
  }),
  { type: authRoleEntityType },
);

export type AuthRoleConfig = z.infer<typeof authRoleSchema>;

export const AUTH_DEFAULT_ROLES = [
  {
    name: 'public',
    comment: 'All users (including unauthenticated and authenticated users)',
    builtIn: true,
  },
  {
    name: 'user',
    comment: 'All authenticated users',
    builtIn: true,
  },
  {
    name: 'system',
    comment: 'System processes without a user context, e.g. background jobs',
    builtIn: true,
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
  roles: z.array(authRoleSchema).transform((roles) => [
    ...AUTH_DEFAULT_ROLES.map((r) => {
      const existingRole = roles.find((role) => role.name === r.name);
      return existingRole
        ? {
            ...existingRole,
            builtIn: true,
          }
        : {
            ...r,
            builtIn: true,
            id: authRoleEntityType.generateNewId(),
          };
    }),
    // Filter out the built-in roles
    ...roles.filter(
      (r) => !AUTH_DEFAULT_ROLES.map((v) => v.name).includes(r.name),
    ),
  ]),
});

export type AuthConfig = z.infer<typeof authSchema>;
