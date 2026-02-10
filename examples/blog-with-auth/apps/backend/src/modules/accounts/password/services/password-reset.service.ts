import {
  PasswordChangedEmail,
  PasswordResetEmail,
} from '@blog-with-auth/transactional';
import * as crypto from 'node:crypto';
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
import { createPasswordHash } from './password-hasher.service.js';

const PROVIDER_ID = 'email-password';

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

/**
 * Generates a cryptographically secure token for password reset.
 * Uses 128 bits of randomness (same as session tokens).
 */
function generateResetToken(): string {
  return crypto.randomBytes(16).toString('base64url');
}

/**
 * Creates a SHA-256 hash of the token.
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

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
    getPasswordResetGlobalLimiter().consume('global'),
  ]);

  // Find user by email - silently handle non-existent users to prevent enumeration
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (user?.email) {
    // Per-email rate limit (silent - don't reveal email existence)
    const emailLimitResult =
      await getPasswordResetEmailLimiter().consume(email);

    if (emailLimitResult.allowed) {
      // Generate token
      const token = generateResetToken();
      const tokenHash = hashToken(token);
      const expiresAt = new Date(
        Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_SEC * 1000,
      );

      // Store the hashed token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      // Construct reset URL using configured base URL
      const resetLink = `${config.PASSWORD_RESET_URL_BASE}?token=${encodeURIComponent(token)}`;

      // Send email asynchronously (queue-based)
      await sendEmail(PasswordResetEmail, {
        to: user.email,
        data: { resetLink },
      });
    }
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

  const tokenHash = hashToken(token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { expiresAt: true },
  });

  if (!resetToken) {
    return { valid: false };
  }

  // Check if expired
  if (resetToken.expiresAt < new Date()) {
    return { valid: false };
  }

  return { valid: true };
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
 * - Password update and token deletion are transactional
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

  const tokenHash = hashToken(token);

  // Find the token
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: { id: true, email: true },
      },
    },
  });

  if (!resetToken) {
    throw new BadRequestError('Invalid or expired token', 'invalid-token');
  }

  // Check if expired
  if (resetToken.expiresAt < new Date()) {
    throw new BadRequestError('Token has expired', 'token-expired');
  }

  const { user } = resetToken;

  if (!user.email) {
    throw new BadRequestError('User has no email', 'user-has-no-email');
  }

  // Update password and delete token in a transaction
  const passwordHash = await createPasswordHash(newPassword);

  await prisma.$transaction([
    // Delete the token (single-use enforcement)
    prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    }),
    // Update or create password
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
    // Always invalidate all existing sessions for security
    prisma.userSession.deleteMany({
      where: { userId: user.id },
    }),
  ]);

  // Send password changed confirmation email
  await sendEmail(PasswordChangedEmail, {
    to: user.email,
    data: {},
  });

  return { success: true };
}

/**
 * Cleanup job to delete expired password reset tokens.
 * Should be called periodically (e.g., via cron job or queue).
 * Note: Used tokens are deleted immediately, so this only cleans up expired ones.
 */
export async function cleanupExpiredPasswordResetTokens(): Promise<{
  deletedCount: number;
}> {
  const result = await prisma.passwordResetToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return { deletedCount: result.count };
}
