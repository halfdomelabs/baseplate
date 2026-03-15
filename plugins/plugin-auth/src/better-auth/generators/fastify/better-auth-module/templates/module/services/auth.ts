// @ts-nocheck

import type { AuthRole } from '%authRolesImports';

import { DEFAULT_USER_ROLES } from '%authRolesImports';
import { config } from '%configServiceImports';
import { sendEmail } from '%emailModuleImports';
import { prisma } from '%prismaImports';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { customSession } from 'better-auth/plugins';

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
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ url, user }) {
      await sendEmail(TPL_PASSWORD_RESET_EMAIL, {
        to: user.email,
        data: { resetLink: url },
      });
    },
    resetPasswordTokenExpiresIn: 3600,
  },
  emailVerification: {
    sendOnSignUp: true,
    async sendVerificationEmail({ url, user }) {
      await sendEmail(TPL_ACCOUNT_VERIFICATION_EMAIL, {
        to: user.email,
        data: { verifyLink: url },
      });
    },
  },
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
    changeEmail: {
      enabled: true,
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const userRoles = await TPL_USER_ROLE_MODEL.findMany({
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
