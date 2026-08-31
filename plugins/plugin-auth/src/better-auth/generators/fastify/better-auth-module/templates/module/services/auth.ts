// @ts-nocheck

import type { AuthRole } from '%authRolesImports';
import type { EmailService } from '%emailModuleImports';

import { deriveKey } from '%appSecretImports';
import { getWebOrigins, getWebUrl } from '%appUrlsImports';
import { DEFAULT_USER_ROLES } from '%authRolesImports';
import { getConfig } from '%configServiceImports';
import { prisma } from '%prismaImports';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { customSession } from 'better-auth/plugins';

// Read at module scope: this module already requires backend env at import
// via the Prisma client.
const config = getConfig();

/**
 * Returns the cookie prefix for Better Auth.
 * In development, scopes cookies to the server port to avoid collisions
 * when running multiple apps on localhost.
 */
export const cookiePrefix =
  config.APP_ENVIRONMENT === 'dev'
    ? `better-auth-${config.SERVER_PORT}`
    : 'better-auth';

/**
 * Dependencies `auth` needs at construction time.
 */
export interface AuthServiceDeps {
  email: EmailService;
}

export type Auth = ReturnType<typeof buildAuth>;

/**
 * Constructs a fresh {@link Auth} instance from the given deps. Called once
 * per AppRuntime, inside `createAppRuntime()`, and exposed as
 * `services.betterAuth` - not memoized here, since a runtime's services are
 * only ever built once for the runtime's lifetime.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- return type is self-referential (Auth is derived from it above); betterAuth()'s inferred generic return type can't be spelled out by hand
export const buildAuth = ({ email }: AuthServiceDeps) =>
  betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    secret: deriveKey('auth:better-auth:v1').toString('base64url'),
    baseURL: config.BETTER_AUTH_URL,
    basePath: '/auth',
    emailAndPassword: {
      enabled: true,
      async sendResetPassword({ token, user }) {
        const resetLink = getWebUrl(
          TPL_AUTH_WEB_APP,
          `/auth/reset-password?token=${token}`,
        );
        await email.send(TPL_PASSWORD_RESET_EMAIL, {
          to: user.email,
          data: { resetLink },
        });
      },
      resetPasswordTokenExpiresIn: 3600,
    },
    emailVerification: {
      sendOnSignUp: true,
      async sendVerificationEmail({ token, user }) {
        const verifyLink = getWebUrl(
          TPL_AUTH_WEB_APP,
          `/auth/verify-email?token=${token}`,
        );
        await email.send(TPL_ACCOUNT_VERIFICATION_EMAIL, {
          to: user.email,
          data: { verifyLink },
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
    trustedOrigins: getWebOrigins(),
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
