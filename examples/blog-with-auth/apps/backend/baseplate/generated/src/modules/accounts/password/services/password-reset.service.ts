import {
  PasswordChangedEmail,
  PasswordResetEmail,
} from '@blog-with-auth/transactional';
import z from 'zod';

import type { RequestServiceContext } from '@src/utils/request-service-context.js';

import { config } from '@src/services/config.js';
import { prisma } from '@src/services/prisma.js';
import { memoizeRateLimiter } from '@src/services/rate-limiter.service.js';
import { BadRequestError } from '@src/utils/http-errors.js';
import { handleZodRequestValidationError } from '@src/utils/zod.js';

import { sendEmail } from '../../../emails/services/emails.service.js';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RESET_TOKEN_EXPIRY_SEC,
} from '../constants/password.constants.js';
import {
  createAuthVerification,
  validateAuthVerification,
} from './auth-verification.service.js';
import { createPasswordHash } from './password-hasher.service.js';

const PROVIDER_ID = 'email-password';
const PASSWORD_RESET_TYPE = 'password-reset';

/**
 * Rate limiters for password reset operations.
 */

// Per-email rate limit: 3 requests/hour
const getPasswordResetEmailLimiter = memoizeRateLimiter(
  'password-reset-email',
  {
    points: 3,
    duration: 60 * 60, // 1 hour
  },
);

// Per-IP rate limit: 10 requests/hour (prevents email scanning)
const getPasswordResetIpLimiter = memoizeRateLimiter('password-reset-ip', {
  points: 10,
  duration: 60 * 60, // 1 hour
});

// Global rate limit: 100 requests/hour (prevents overloading the email service)
const getPasswordResetGlobalLimiter = memoizeRateLimiter(
  'password-reset-global',
  {
    points: 100,
    duration: 60 * 60, // 1 hour
  },
);

const requestPasswordResetSchema = z.object({
  email: z
    .email()
    .max(PASSWORD_MAX_LENGTH)
    .transform((value) => value.toLowerCase()),
});

/**
 * Request a password reset for the given email.
 */
export async function requestPasswordReset({
  email: rawEmail,
  context,
}: {
  email: string;
  context: RequestServiceContext;
}): Promise<{ success: true }> {
  const { email } = await requestPasswordResetSchema
    .parseAsync({ email: rawEmail })
    .catch(handleZodRequestValidationError);

  await Promise.all([
    getPasswordResetIpLimiter().consumeOrThrow(
      context.reqInfo.ip,
      'Too many password reset attempts. Please try again later.',
      'too-many-requests',
    ),
    getPasswordResetEmailLimiter().consumeOrThrow(
      email,
      'Too many password reset attempts. Please try again later.',
      'too-many-requests',
    ),
    getPasswordResetGlobalLimiter().consumeOrThrow(
      'global',
      'Too many password reset attempts. Please try again later.',
      'too-many-requests',
    ),
  ]);

  // Find user by email - silently handle non-existent users to prevent enumeration
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (user?.email) {
    const { token } = await createAuthVerification({
      type: PASSWORD_RESET_TYPE,
      userId: user.id,
      expiresInSec: PASSWORD_RESET_TOKEN_EXPIRY_SEC,
    });

    // Construct reset URL using configured domain
    const resetLink = `${config.AUTH_FRONTEND_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;

    // Send email asynchronously (queue-based)
    await sendEmail(
      /* TPL_PASSWORD_RESET_EMAIL:START */ PasswordResetEmail /* TPL_PASSWORD_RESET_EMAIL:END */,
      {
        to: user.email,
        data: { resetLink },
      },
    );
  }

  // Always return success to prevent user enumeration
  return { success: true };
}

const validateTokenSchema = z.object({
  token: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

/**
 * Validates a password reset token without consuming it.
 * Used by the frontend to verify the token is valid before showing the reset form.
 */
export async function validatePasswordResetToken({
  token: rawToken,
}: {
  token: string;
}): Promise<{ valid: boolean }> {
  const { token } = await validateTokenSchema
    .parseAsync({ token: rawToken })
    .catch(handleZodRequestValidationError);

  const record = await validateAuthVerification({
    type: PASSWORD_RESET_TYPE,
    token,
  });

  return { valid: record !== null };
}

const completePasswordResetSchema = z.object({
  token: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});

/**
 * Completes the password reset process by setting a new password.
 *
 * Security notes (OWASP Forgot Password Cheat Sheet):
 * - Token is single-use (deleted after successful reset)
 * - Does not auto-login the user
 * - Always invalidates all existing sessions for security
 * - All remaining password-reset tokens for this user are deleted
 */
export async function completePasswordReset({
  token: rawToken,
  newPassword: rawNewPassword,
}: {
  token: string;
  newPassword: string;
}): Promise<{ success: true }> {
  const { token, newPassword } = await completePasswordResetSchema
    .parseAsync({
      token: rawToken,
      newPassword: rawNewPassword,
    })
    .catch(handleZodRequestValidationError);

  const record = await validateAuthVerification({
    type: PASSWORD_RESET_TYPE,
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

  // Delete token + remaining reset tokens + update password + invalidate sessions
  await prisma.$transaction([
    prisma.authVerification.deleteMany({
      where: { type: PASSWORD_RESET_TYPE, userId: user.id },
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
    prisma.userSession.deleteMany({
      where: { userId: user.id },
    }),
  ]);

  // Send password changed confirmation email
  await sendEmail(
    /* TPL_PASSWORD_CHANGED_EMAIL:START */ PasswordChangedEmail /* TPL_PASSWORD_CHANGED_EMAIL:END */,
    {
      to: user.email,
      data: {},
    },
  );

  return { success: true };
}
