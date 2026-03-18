import { authRoleEntityType } from '@baseplate-dev/project-builder-lib';

import type { AuthRoleDefinition } from './schema.js';

export const AUTH_DEFAULT_ROLES: Omit<AuthRoleDefinition, 'id'>[] = [
  {
    name: 'public',
    comment: 'All users (including unauthenticated and authenticated users)',
    builtIn: true,
    autoAssigned: true,
  },
  {
    name: 'user',
    comment: 'All authenticated users',
    builtIn: true,
    autoAssigned: true,
  },
  {
    name: 'system',
    comment: 'System processes without a user context, e.g. background jobs',
    builtIn: true,
    autoAssigned: true,
  },
  {
    name: 'admin',
    comment: 'Administrator with full access',
    builtIn: true,
    autoAssigned: false,
  },
];

export function createDefaultAuthRoles(): AuthRoleDefinition[] {
  return AUTH_DEFAULT_ROLES.map((role) => ({
    ...role,
    id: authRoleEntityType.generateNewId(),
  }));
}
