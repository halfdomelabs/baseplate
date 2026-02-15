import { AccountVerificationEmail } from '@blog-with-auth/transactional';

import type { RequestServiceContext } from '@src/utils/request-service-context.js';

import { config } from '@src/services/config.js';
import { prisma } from '@src/services/prisma.js';
import { memoizeRateLimiter } from '@src/services/rate-limiter.service.js';
import { BadRequestError } from '@src/utils/http-errors.js';

import { sendEmail } from '../../../emails/services/emails.service.js';
import { EMAIL_VERIFICATION_TOKEN_EXPIRY_SEC } from '../constants/password.constants.js';
import {
  createAuthVerification,
  validateAuthVerification,
} from './auth-verification.service.js';

const EMAIL_VERIFY_TYPE = 'email-verify';

/**
 * Rate limiters for email verification operations.
 */

// Per-user rate limit: 3 requests per 20 minutes
const getRequestEmailVerificationUserLimiter = memoizeRateLimiter(
  'request-email-verification-user',
  {
    points: 3,
    duration: 60 * 20, // 20 minutes
  },
);

// Per-IP rate limit: 10 requests/hour
const getRequestEmailVerificationIpLimiter = memoizeRateLimiter(
  'request-email-verification-ip',
  {
    points: 10,
    duration: 60 * 60, // 1 hour
  },
);

// Per-IP rate limit for verify endpoint: 10 requests/hour
const getVerifyEmailIpLimiter = memoizeRateLimiter('verify-email-ip', {
  points: 10,
  duration: 60 * 60, // 1 hour
});

/**
 * Request an email verification for the authenticated user.
 * Sends a verification email with a link to verify.
 */
export async function requestEmailVerification({
  userId,
  context,
}: {
  userId: string;
  context: RequestServiceContext;
}): Promise<{ success: true }> {
  await Promise.all([
    getRequestEmailVerificationIpLimiter().consumeOrThrow(
      context.reqInfo.ip,
      'Too many verification attempts. Please try again later.',
      'too-many-requests',
    ),
    getRequestEmailVerificationUserLimiter().consumeOrThrow(
      userId,
      'Too many verification attempts. Please try again later.',
      'too-many-requests',
    ),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true },
  });

  if (!user?.email) {
    throw new BadRequestError('No email address on account', 'no-email');
  }

  if (user.emailVerified) {
    return { success: true };
  }

  const { token } = await createAuthVerification({
    type: EMAIL_VERIFY_TYPE,
    userId: user.id,
    expiresInSec: EMAIL_VERIFICATION_TOKEN_EXPIRY_SEC,
  });

  // Construct verification URL using configured domain
  const verifyLink = `${config.AUTH_FRONTEND_URL}/auth/verify-email?token=${encodeURIComponent(token)}`;

  await sendEmail(AccountVerificationEmail, {
    to: user.email,
    data: { verifyLink },
  });

  return { success: true };
}

/**
 * Verify a user's email using the token from the verification email.
 * This is a public (anonymous) mutation — the token proves identity.
 *
 * @throws BadRequestError if token is invalid or expired
 */
export async function verifyEmail({
  token,
  context,
}: {
  token: string;
  context: RequestServiceContext;
}): Promise<{ success: true }> {
  await getVerifyEmailIpLimiter().consumeOrThrow(
    context.reqInfo.ip,
    'Too many verification attempts. Please try again later.',
    'too-many-requests',
  );

  const record = await validateAuthVerification({
    type: EMAIL_VERIFY_TYPE,
    token,
  });

  if (!record?.userId) {
    throw new BadRequestError('Invalid or expired token', 'invalid-token');
  }

  // Delete this token + remaining email-verify tokens + update user in one transaction
  await prisma.$transaction([
    prisma.authVerification.deleteMany({
      where: { type: EMAIL_VERIFY_TYPE, userId: record.userId },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    }),
  ]);

  return { success: true };
}
