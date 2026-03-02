import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { customSession } from 'better-auth/plugins';

import { config } from '@src/services/config.js';
import { prisma } from '@src/services/prisma.js';

import type { AuthRole } from '../constants/auth-roles.constants.js';

import { DEFAULT_USER_ROLES } from '../constants/auth-roles.constants.js';

/**
 * Returns the cookie prefix for Better Auth.
 * In development, scopes cookies to the server port to avoid collisions
 * when running multiple apps on localhost.
 */
export const cookiePrefix =
  config.APP_ENVIRONMENT === 'dev'
    ? `better-auth-${config.SERVER_PORT}`
    : 'better-auth';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: config.BETTER_AUTH_SECRET,
  baseURL: config.BETTER_AUTH_URL,
  basePath: '/auth',
  emailAndPassword: { enabled: true },
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  advanced: {
    cookiePrefix,
    database: {
      generateId: false,
    },
  },
  trustedOrigins: config.ALLOWED_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  user: {
    modelName: 'User',
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const userRoles =
        await /* TPL_USER_ROLE_MODEL:START */ prisma.userRole /* TPL_USER_ROLE_MODEL:END */
          .findMany({
            where: { userId: user.id },
          });

      const roles = [
        ...new Set([...DEFAULT_USER_ROLES, ...userRoles.map((r) => r.role)]),
      ] as AuthRole[];

      return {
        user,
        session: {
          ...session,
          roles,
        },
      };
    }),
  ],
});
