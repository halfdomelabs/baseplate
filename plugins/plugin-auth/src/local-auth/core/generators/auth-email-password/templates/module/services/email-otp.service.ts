// @ts-nocheck

import type {
  RequestServiceContext,
  RequestServiceContextWith,
} from '%requestServiceContextImports';
import type { UserSessionPayload } from '%userSessionTypesImports';
import type { CookieSerializeOptions } from '@fastify/cookie';

import {
  EMAIL_OTP_EXPIRY_SEC,
  EMAIL_OTP_LENGTH,
  EMAIL_OTP_MAX_ATTEMPTS,
} from '$constantsOtp';
import { PASSWORD_MAX_LENGTH } from '$constantsPassword';
import {
  consumeCodeVerification,
  createCodeVerification,
  validateCodeVerification,
} from '%authModuleImports';
import { isDevelopment } from '%configServiceImports';
import {
  BadRequestError,
  handleZodRequestValidationError,
} from '%errorHandlerServiceImports';
import { prisma } from '%prismaImports';
import { memoizeRateLimiter } from '%rateLimitImports';
import * as crypto from 'node:crypto';
import z from 'zod';

const PROVIDER_ID = 'email-otp';
const EMAIL_OTP_TYPE = 'email-otp';

/**
 * Rate limiters for emailed sign-in codes.
 */

// Per-email burst limit: 3 codes / 15 minutes
const getEmailOtpRequestEmailLimiter = memoizeRateLimiter('email-otp-email', {
  points: 3,
  duration: 60 * 15, // 15 minutes
});

// Per-email daily cap. Each new code resets that code's attempt budget, so
// this is what actually bounds guesses per day: 10 codes x 5 attempts.
const getEmailOtpRequestEmailDailyLimiter = memoizeRateLimiter(
  'email-otp-email-daily',
  {
    points: 10,
    duration: 60 * 60 * 24, // 1 day
  },
);

// Per-IP rate limit: 10 codes/hour (prevents email scanning)
const getEmailOtpRequestIpLimiter = memoizeRateLimiter('email-otp-ip', {
  points: 10,
  duration: 60 * 60, // 1 hour
});

// Deliberately no global limiter here. A shared counter would let anyone who
// exhausts it lock every user out of signing in, and accounts created through
// this flow have no password to fall back on. Distributed abuse is bounded by
// the per-IP limit above; protecting the email provider from a cost or
// reputation spike belongs in its own quotas and alerting, not in the login
// path.

// Per-address verification limit. Unlike the per-code attempt budget this
// survives the code being reissued, and unlike the per-IP limit it survives
// the attacker rotating IPs.
const getEmailOtpVerifyEmailLimiter = memoizeRateLimiter(
  'email-otp-verify-email',
  {
    points: 10,
    duration: 60 * 60, // 1 hour
    blockDuration: 60 * 60, // Block for 1 hour if exceeded
  },
);

// Per-IP verification limit, on top of each code's own attempt budget
const getEmailOtpVerifyIpLimiter = memoizeRateLimiter('email-otp-verify-ip', {
  points: 20,
  duration: 60 * 60, // 1 hour
  blockDuration: 60 * 60, // Block for 1 hour if exceeded
});

/**
 * Cookie holding the id of the pending verification.
 *
 * Requiring it at verification binds a code to the browser that asked for it,
 * so a code read over someone's shoulder or talked out of them over the phone
 * cannot be redeemed elsewhere.
 */
const EMAIL_OTP_COOKIE_NAME = 'email-otp-verification';

function getEmailOtpCookieOptions(): CookieSerializeOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: !isDevelopment(),
    maxAge: EMAIL_OTP_EXPIRY_SEC,
    path: '/',
  };
}

const emailSchema = z.object({
  email: z
    .email()
    .max(PASSWORD_MAX_LENGTH)
    .transform((value) => value.toLowerCase()),
});

/**
 * Generates a numeric code using rejection sampling so every digit is equally
 * likely. 250 is the largest multiple of 10 within a byte, so values above it
 * are discarded rather than folded back and over-weighting digits 0-5.
 */
function generateNumericCode(length: number): string {
  const digits = Array.from({ length }, () => {
    let value = 256;
    while (value >= 250) {
      value = crypto.randomBytes(1).readUInt8(0);
    }
    return String(value % 10);
  });
  return digits.join('');
}

/**
 * Emails a single-use sign-in code to the given address.
 *
 * A code is sent whether or not an account exists — verifying one signs the
 * user in, creating the account on first use — so this endpoint reveals
 * nothing about which addresses are registered.
 */
export async function requestEmailOtp({
  email: rawEmail,
  context,
}: {
  email: string;
  context: RequestServiceContextWith<'email'>;
}): Promise<{ success: true }> {
  const { services } = context;

  const { email } = await emailSchema
    .parseAsync({ email: rawEmail })
    .catch(handleZodRequestValidationError);

  await Promise.all([
    getEmailOtpRequestIpLimiter().consumeOrThrow(
      context.reqInfo.ip,
      'Too many sign-in code requests. Please try again later.',
      'too-many-requests',
    ),
    getEmailOtpRequestEmailLimiter().consumeOrThrow(
      email,
      'Too many sign-in code requests. Please try again later.',
      'too-many-requests',
    ),
    getEmailOtpRequestEmailDailyLimiter().consumeOrThrow(
      email,
      'Too many sign-in code requests. Please try again later.',
      'too-many-requests',
    ),
  ]);

  const code = generateNumericCode(EMAIL_OTP_LENGTH);

  const { id: verificationId } = await createCodeVerification({
    type: EMAIL_OTP_TYPE,
    identifier: email,
    code,
    expiresInSec: EMAIL_OTP_EXPIRY_SEC,
  });

  context.cookieStore.set(
    EMAIL_OTP_COOKIE_NAME,
    verificationId,
    getEmailOtpCookieOptions(),
  );

  await services.email.send(TPL_EMAIL_OTP_EMAIL, {
    to: email,
    data: { code, expiryMinutes: Math.floor(EMAIL_OTP_EXPIRY_SEC / 60) },
  });

  return { success: true };
}

const verifyEmailOtpSchema = z.object({
  email: z
    .email()
    .max(PASSWORD_MAX_LENGTH)
    .transform((value) => value.toLowerCase()),
  code: z.string().length(EMAIL_OTP_LENGTH),
  // Blank and whitespace-only names are normalized to absent rather than
  // rejected, so a client that always sends the field still gets the
  // `name-required` response rather than a generic validation failure.
  name: z
    .string()
    .max(100)
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    }),
});

/**
 * Signs a user in with an emailed code, creating the account on first use.
 *
 * A verified code proves control of the inbox, so the account it creates (or
 * signs in to) is marked as having a verified email. Accounts created this way
 * have no password until the user goes through the password reset flow.
 *
 * @throws BadRequestError `name-required` when the code is valid but the
 * address has no account yet and no name was supplied. The code is left intact
 * so the client can collect a name and retry with it.
 */
export async function signInWithEmailOtp({
  input,
  context,
}: {
  input: {
    email: string;
    code: string;
    name?: string;
  };
  context: RequestServiceContext;
}): Promise<{ session: UserSessionPayload }> {
  const { email, code, name } = await verifyEmailOtpSchema
    .parseAsync(input)
    .catch(handleZodRequestValidationError);

  await getEmailOtpVerifyIpLimiter().consumeOrThrow(
    context.reqInfo.ip,
    'Too many sign-in attempts. Please try again later.',
    'too-many-requests',
  );

  // A code is only redeemable in the browser that requested it.
  const verificationId = context.cookieStore.get(EMAIL_OTP_COOKIE_NAME);

  if (!verificationId) {
    throw new BadRequestError(
      'This code must be entered in the browser that requested it',
      'verification-context-missing',
    );
  }

  // Establish that this browser owns the outstanding code before spending any
  // of the address's budget. Charging first would let anyone lock a chosen
  // address out of signing in just by posting its email with a junk code —
  // which is worse than it sounds, because an account created through this
  // flow has no password to fall back on.
  const challenge = await prisma.authVerification.findUnique({
    where: { type_identifier: { type: EMAIL_OTP_TYPE, identifier: email } },
    select: { id: true },
  });

  if (challenge?.id !== verificationId) {
    throw new BadRequestError('Invalid or expired code', 'invalid-code');
  }

  await getEmailOtpVerifyEmailLimiter().consumeOrThrow(
    email,
    'Too many sign-in attempts. Please try again later.',
    'too-many-requests',
  );

  const record = await validateCodeVerification({
    type: EMAIL_OTP_TYPE,
    identifier: email,
    code,
    maxAttempts: EMAIL_OTP_MAX_ATTEMPTS,
  });

  if (!record) {
    throw new BadRequestError('Invalid or expired code', 'invalid-code');
  }

  // Re-checked because a fresh code may have been issued since the lookup
  // above, which would have replaced the id this browser is holding.
  if (record.id !== verificationId) {
    throw new BadRequestError('Invalid or expired code', 'invalid-code');
  }

  // Asking for a name only when the address is new would normally leak whether
  // an account exists. Gating it behind a valid code keeps that safe: only
  // someone who controls the mailbox reaches this point.
  TPL_NAME_REQUIRED_CHECK;

  // Spending the code and settling the account commit together, so a failure
  // partway through leaves the code still usable rather than burning it and
  // forcing the user to request another.
  const userId = await prisma.$transaction(async (tx) => {
    if (!(await consumeCodeVerification({ id: record.id, client: tx }))) {
      throw new BadRequestError('Invalid or expired code', 'invalid-code');
    }

    // Receiving the code proves control of the address, so the account is
    // created (or marked) as verified. An existing user's name is left alone.
    const { id } = await tx.user.upsert({
      where: { email },
      create: {
        email,
        name,
        emailVerified: true,
        accounts: {
          create: {
            accountId: email,
            providerId: PROVIDER_ID,
          },
        },
      },
      update: { emailVerified: true },
      select: { id: true },
    });

    return id;
  });

  context.cookieStore.clear(EMAIL_OTP_COOKIE_NAME, getEmailOtpCookieOptions());

  // Outside the transaction: session creation manages its own storage through
  // the request context. If it fails the code is spent, but the account now
  // exists, so retrying signs the user in without asking for a name again.
  const session = await context.services.userSession.createSession(
    userId,
    context,
  );

  return { session };
}
