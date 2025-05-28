import { authRoleEntityType } from '@halfdomelabs/project-builder-lib';

import type { AuthRoleDefinition } from './schema';

export const AUTH_DEFAULT_ROLES: Omit<AuthRoleDefinition, 'id'>[] = [
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

export function createDefaultAuthRoles(): AuthRoleDefinition[] {
  return AUTH_DEFAULT_ROLES.map((role) => ({
    ...role,
    id: authRoleEntityType.generateNewId(),
  }));
}
