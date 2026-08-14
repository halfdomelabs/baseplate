// @ts-nocheck

import type { User } from '%prismaGeneratedImports';
import type {
  RequestServiceContext,
  RequestServiceContextWith,
} from '%requestServiceContextImports';
import type { UserSessionPayload } from '%userSessionTypesImports';

import {
  AUTH_TOKEN_MAX_LENGTH,
  INVITE_TOKEN_EXPIRY_SEC,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '$constantsPassword';
import {
  createAuthVerification,
  validateAuthVerification,
} from '%authModuleImports';
import { getConfig } from '%configServiceImports';
import {
  BadRequestError,
  handleZodRequestValidationError,
  NotFoundError,
} from '%errorHandlerServiceImports';
import { createPasswordHash } from '%passwordHasherServiceImports';
import { prisma } from '%prismaImports';
import z from 'zod';

const PROVIDER_ID = 'email-password';
const INVITE_TYPE = 'invite';

/**
 * Sends an invite email so a user can set their password and sign in.
 * Admin-triggered, so unlike password reset requests, it does not need
 * anti-enumeration rate limiting.
 */
export async function inviteUser({
  userId,
  context,
}: {
  userId: string;
  context: RequestServiceContextWith<'email'>;
}): Promise<{ user: User }> {
  const { services } = context;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('User not found', 'user-not-found');
  }

  if (!user.email) {
    throw new BadRequestError('User has no email', 'user-has-no-email');
  }

  const existingAccount = await prisma.userAccount.findUnique({
    where: {
      accountId_providerId: {
        accountId: user.email,
        providerId: PROVIDER_ID,
      },
    },
  });

  if (existingAccount) {
    throw new BadRequestError(
      'User already has a password set',
      'user-already-has-account',
    );
  }

  const { token } = await createAuthVerification({
    type: INVITE_TYPE,
    userId: user.id,
    expiresInSec: INVITE_TOKEN_EXPIRY_SEC,
  });

  const acceptLink = `${getConfig().AUTH_FRONTEND_URL}/auth/accept-invite?token=${encodeURIComponent(token)}`;

  await services.email.send(TPL_INVITE_EMAIL, {
    to: user.email,
    data: { acceptLink },
  });

  return { user };
}

const validateTokenSchema = z.object({
  token: z.string().min(1).max(AUTH_TOKEN_MAX_LENGTH),
});

/**
 * Validates an invite token without consuming it.
 * Used by the frontend to verify the token is valid and to show the
 * invited email before displaying the set-password form.
 *
 * @throws BadRequestError with code 'invalid-token' if the token is invalid or expired
 */
export async function validateInviteToken({
  token: rawToken,
}: {
  token: string;
}): Promise<{ email: string }> {
  const { token } = await validateTokenSchema
    .parseAsync({ token: rawToken })
    .catch(handleZodRequestValidationError);

  const record = await validateAuthVerification({
    type: INVITE_TYPE,
    token,
  });

  if (!record?.userId) {
    throw new BadRequestError('Invalid or expired token', 'invalid-token');
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: record.userId },
    select: { email: true },
  });

  if (!user.email) {
    throw new BadRequestError('User has no email', 'user-has-no-email');
  }

  return { email: user.email };
}

const acceptInviteSchema = z.object({
  token: z.string().min(1).max(AUTH_TOKEN_MAX_LENGTH),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});

/**
 * Completes the invite flow by setting the invited user's password and
 * signing them in. Token is single-use (deleted after acceptance, along
 * with any other pending invite tokens for the user).
 */
export async function acceptInvite({
  token: rawToken,
  newPassword: rawNewPassword,
  context,
}: {
  token: string;
  newPassword: string;
  context: RequestServiceContext;
}): Promise<{ session: UserSessionPayload }> {
  const { token, newPassword } = await acceptInviteSchema
    .parseAsync({
      token: rawToken,
      newPassword: rawNewPassword,
    })
    .catch(handleZodRequestValidationError);

  const record = await validateAuthVerification({
    type: INVITE_TYPE,
    token,
  });

  if (!record?.userId) {
    throw new BadRequestError('Invalid or expired token', 'invalid-token');
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: record.userId },
    select: { id: true, email: true },
  });

  if (!user.email) {
    throw new BadRequestError('User has no email', 'user-has-no-email');
  }

  const passwordHash = await createPasswordHash(newPassword);

  await prisma.$transaction([
    prisma.authVerification.deleteMany({
      where: { type: INVITE_TYPE, userId: user.id },
    }),
    prisma.userAccount.upsert({
      where: {
        accountId_providerId: {
          accountId: user.email,
          providerId: PROVIDER_ID,
        },
      },
      create: {
        userId: user.id,
        accountId: user.email,
        providerId: PROVIDER_ID,
        password: passwordHash,
      },
      update: {
        password: passwordHash,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    }),
  ]);

  const session = await context.services.userSession.createSession(
    user.id,
    context,
  );

  return { session };
}
