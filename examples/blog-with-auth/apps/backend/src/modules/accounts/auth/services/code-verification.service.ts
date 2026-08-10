import * as crypto from 'node:crypto';

import type { AuthVerification } from '@src/generated/prisma/client.js';

import { getConfig } from '@src/services/config.js';
import { prisma } from '@src/services/prisma.js';

import { safeCompare } from './auth-verification.service.js';

/**
 * Short code verifications, for flows that email a handful of digits rather
 * than a link.
 *
 * These share the `AuthVerification` table with the split-token flows in
 * {@link ./auth-verification.service.js} but not their security model: the
 * secret is short enough to guess, so it is keyed rather than hashed, carries
 * its own attempt budget, and is addressed by a caller-supplied identifier
 * instead of a random selector.
 */

/**
 * Derives the stored value for a short code.
 *
 * Short codes occupy a keyspace small enough to invert a plain digest by
 * exhaustive search, so they are keyed with the server secret rather than
 * hashed: an attacker holding only the database cannot recover them. The type
 * and identifier are mixed in so a stored value is valid solely for the flow
 * and address it was issued for.
 */
function hashCode({
  type,
  identifier,
  code,
}: {
  type: string;
  identifier: string;
  code: string;
}): string {
  return crypto
    .createHmac('sha256', getConfig().AUTH_SECRET)
    .update(`${type}:${identifier}:${code}`)
    .digest('hex');
}

/**
 * Creates or replaces a short code verification (e.g. an emailed OTP).
 *
 * The identifier is caller-supplied (typically an email) rather than a random
 * selector, so the code cannot be folded into a single token the way a
 * split-token flow does. Only one code may be outstanding per
 * `type`/`identifier` pair, so requesting a new one replaces any existing code
 * and resets the attempt counter.
 *
 * The identifier rather than a user reference is the subject here, since a
 * code may be issued for an address that has no account yet.
 *
 * @param code - The plaintext code sent to the user; only its hash is stored
 */
export async function createCodeVerification({
  type,
  identifier,
  code,
  expiresInSec,
}: {
  type: string;
  identifier: string;
  code: string;
  expiresInSec: number;
}): Promise<{ id: string }> {
  const value = hashCode({ type, identifier, code });
  const expiresAt = new Date(Date.now() + expiresInSec * 1000);

  const { id } = await prisma.authVerification.upsert({
    where: { type_identifier: { type, identifier } },
    create: {
      type,
      identifier,
      value,
      metadata: { attempts: 0 },
      expiresAt,
    },
    update: {
      value,
      metadata: { attempts: 0 },
      expiresAt,
    },
    select: { id: true },
  });

  return { id };
}

/**
 * Validates a short code verification without consuming it, so the caller can
 * gather any further input it needs before committing.
 *
 * Security: a short numeric code has far less entropy than a random token, so
 * each code carries its own attempt counter in `metadata` alongside the
 * endpoint rate limits. The record is deleted when the code has expired or the
 * attempt budget is exhausted. Pass the returned record to
 * {@link consumeCodeVerification} to complete the flow.
 */
export async function validateCodeVerification({
  type,
  identifier,
  code,
  maxAttempts,
}: {
  type: string;
  identifier: string;
  code: string;
  maxAttempts: number;
}): Promise<AuthVerification | null> {
  const record = await prisma.authVerification.findUnique({
    where: { type_identifier: { type, identifier } },
  });

  if (!record) {
    return null;
  }

  if (record.expiresAt < new Date()) {
    await prisma.authVerification.delete({ where: { id: record.id } });
    return null;
  }

  if (safeCompare(record.value, hashCode({ type, identifier, code }))) {
    return record;
  }

  const attempts =
    ((record.metadata as { attempts?: number } | null)?.attempts ?? 0) + 1;

  await (attempts >= maxAttempts
    ? prisma.authVerification.delete({ where: { id: record.id } })
    : prisma.authVerification.update({
        where: { id: record.id },
        data: { metadata: { attempts } },
      }));

  return null;
}

/**
 * Consumes a previously validated verification, returning whether this call is
 * the one that claimed it.
 *
 * The conditional delete is the authorization step: concurrent requests
 * carrying the same code race here, and only the request that removes the row
 * may proceed. Reading the row and deleting it in separate statements would
 * let both win.
 */
export async function consumeCodeVerification({
  id,
}: {
  id: string;
}): Promise<boolean> {
  const { count } = await prisma.authVerification.deleteMany({
    where: { id },
  });

  return count === 1;
}
