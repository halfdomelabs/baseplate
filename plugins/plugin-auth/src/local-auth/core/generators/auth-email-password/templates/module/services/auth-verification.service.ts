// @ts-nocheck

import type { AuthVerification, Prisma } from '%prismaGeneratedImports';

import { prisma } from '%prismaImports';
import * as crypto from 'node:crypto';

/**
 * Split-token pattern for secure verification flows.
 *
 * - selector: random identifier used for DB lookup (stored as `identifier`)
 * - verifier: random secret, hashed before storage (stored as `value`)
 * - token: `{selector}.{verifier}` — the value sent to the user
 */

function generateSplitToken(): { selector: string; verifier: string } {
  return {
    selector: crypto.randomBytes(16).toString('base64url'),
    verifier: crypto.randomBytes(16).toString('base64url'),
  };
}

function hashVerifier(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('hex');
}

/**
 * Constant-time comparison of two hex strings to prevent timing attacks.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

function encodeToken(selector: string, verifier: string): string {
  return `${selector}.${verifier}`;
}

function decodeToken(
  token: string,
): { selector: string; verifier: string } | null {
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) {
    return null;
  }
  return {
    selector: token.slice(0, dotIndex),
    verifier: token.slice(dotIndex + 1),
  };
}

/**
 * Creates a new auth verification using the split-token pattern.
 *
 * @param type - Verification type (e.g., "password-reset", "email-verify")
 * @param userId - Optional user ID to associate with the token
 * @param expiresInSec - Token lifetime in seconds
 * @param metadata - Optional JSON metadata to store with the token
 * @returns The combined token (`{selector}.{verifier}`) to send to the user
 */
export async function createAuthVerification({
  type,
  userId,
  expiresInSec,
  metadata,
}: {
  type: string;
  userId?: string;
  expiresInSec: number;
  metadata?: Prisma.JsonValue;
}): Promise<{ token: string }> {
  const { selector, verifier } = generateSplitToken();
  const value = hashVerifier(verifier);
  const expiresAt = new Date(Date.now() + expiresInSec * 1000);

  await prisma.authVerification.create({
    data: {
      type,
      identifier: selector,
      value,
      userId,
      metadata: metadata ?? undefined,
      expiresAt,
    },
  });

  return { token: encodeToken(selector, verifier) };
}

/**
 * Validates an auth verification token without consuming it.
 * Returns the full record if valid so the caller can delete it
 * as part of their own transaction.
 *
 * Security: If the selector matches but the verifier is wrong or expired,
 * the token is deleted to prevent brute-force attempts.
 *
 * @throws BadRequestError if token is invalid, expired, or malformed
 */
export async function validateAuthVerification({
  type,
  token,
}: {
  type: string;
  token: string;
}): Promise<AuthVerification | null> {
  const decoded = decodeToken(token);

  if (!decoded) {
    return null;
  }

  const record = await prisma.authVerification.findUnique({
    where: { type_identifier: { type, identifier: decoded.selector } },
  });

  if (!record) {
    return null;
  }

  if (
    !safeCompare(record.value, hashVerifier(decoded.verifier)) ||
    record.expiresAt < new Date()
  ) {
    await prisma.authVerification.delete({ where: { id: record.id } });
    return null;
  }

  return record;
}

/**
 * Cleanup job to delete expired auth verification tokens.
 * Should be called periodically (e.g., via cron job or queue).
 */
export async function cleanupExpiredAuthVerifications(): Promise<{
  deletedCount: number;
}> {
  const result = await prisma.authVerification.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return { deletedCount: result.count };
}
