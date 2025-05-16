import { createEntityType } from '@src/references/index.js';

export const authRoleEntityType = createEntityType('role');

export interface AuthRole {
  id: string;
  name: string;
  comment: string;
  builtIn: boolean;
}

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
