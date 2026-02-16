import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import {
  cleanupExpiredAuthVerifications,
  createAuthVerification,
  validateAuthVerification,
} from '@src/modules/accounts/services/auth-verification.service.js';
import { prisma } from '@src/services/prisma.js';

/**
 * Creates a test user and returns the user ID.
 */
async function createTestUser(email: string): Promise<string> {
  const user = await prisma.user.create({
    data: { email },
  });
  return user.id;
}

describe('auth-verification service', () => {
  let testUserId1: string;

  beforeEach(async () => {
    await prisma.authVerification.deleteMany();
    await prisma.user.deleteMany();
    testUserId1 = await createTestUser('test1@example.com');
  });

  afterAll(async () => {
    await prisma.authVerification.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('createAuthVerification', () => {
    it('should create a token and store hashed verifier in the database', async () => {
      const { token } = await createAuthVerification({
        type: 'test',
        userId: testUserId1,
        expiresInSec: 3600,
      });

      // Token should be in selector.verifier format
      expect(token).toContain('.');
      const [selector, verifier] = token.split('.');
      expect(selector).toBeTruthy();
      expect(verifier).toBeTruthy();

      // Record should exist in DB with the selector as identifier
      const record = await prisma.authVerification.findUniqueOrThrow({
        where: { type_identifier: { type: 'test', identifier: selector } },
      });
      expect(record.type).toBe('test');
      expect(record.userId).toBe(testUserId1);
      // Stored value should NOT be the raw verifier
      expect(record.value).not.toBe(verifier);
    });

    it('should store metadata when provided', async () => {
      await createAuthVerification({
        type: 'test',
        expiresInSec: 3600,
        metadata: { newEmail: 'alice@example.com' },
      });

      const record = await prisma.authVerification.findFirstOrThrow({
        where: { type: 'test' },
      });
      expect(record.metadata).toEqual({ newEmail: 'alice@example.com' });
    });

    it('should allow multiple tokens of the same type', async () => {
      await createAuthVerification({ type: 'test', expiresInSec: 3600 });
      await createAuthVerification({ type: 'test', expiresInSec: 3600 });

      const count = await prisma.authVerification.count({
        where: { type: 'test' },
      });
      expect(count).toBe(2);
    });
  });

  describe('validateAuthVerification', () => {
    it('should return the record for a correct token', async () => {
      const { token } = await createAuthVerification({
        type: 'test',
        userId: testUserId1,
        expiresInSec: 3600,
        metadata: { foo: 'bar' },
      });

      const record = await validateAuthVerification({ type: 'test', token });

      expect(record).not.toBeNull();
      expect(record?.userId).toBe(testUserId1);
      expect(record?.metadata).toEqual({ foo: 'bar' });
    });

    it('should return null for a non-existent token', async () => {
      const result = await validateAuthVerification({
        type: 'test',
        token: 'nonexistent.verifier',
      });

      expect(result).toBeNull();
    });

    it('should return null and delete the token when verifier is wrong', async () => {
      const { token } = await createAuthVerification({
        type: 'test',
        expiresInSec: 3600,
      });

      const selector = token.split('.')[0];
      const tamperedToken = `${selector}.wrongverifier`;

      const result = await validateAuthVerification({
        type: 'test',
        token: tamperedToken,
      });

      expect(result).toBeNull();

      // Token should be deleted from DB
      const record = await prisma.authVerification.findUnique({
        where: { type_identifier: { type: 'test', identifier: selector } },
      });
      expect(record).toBeNull();
    });

    it('should return null and delete token when expired', async () => {
      const { token } = await createAuthVerification({
        type: 'test',
        expiresInSec: 0,
      });

      // Wait briefly to ensure expiry
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await validateAuthVerification({ type: 'test', token });

      expect(result).toBeNull();

      // Should be cleaned up
      const remaining = await prisma.authVerification.count({
        where: { type: 'test' },
      });
      expect(remaining).toBe(0);
    });

    it('should not consume the token (token still usable after validate)', async () => {
      const { token } = await createAuthVerification({
        type: 'test',
        expiresInSec: 3600,
      });

      const result1 = await validateAuthVerification({ type: 'test', token });
      expect(result1).not.toBeNull();

      const result2 = await validateAuthVerification({ type: 'test', token });
      expect(result2).not.toBeNull();
    });

    it('should return null for invalid token format', async () => {
      const result = await validateAuthVerification({
        type: 'test',
        token: 'no-dot-separator',
      });

      expect(result).toBeNull();
    });
  });

  describe('cleanupExpiredAuthVerifications', () => {
    it('should delete only expired tokens and return count', async () => {
      // Create an expired token
      await createAuthVerification({ type: 'test', expiresInSec: -1 });
      // Create a valid token
      await createAuthVerification({ type: 'test', expiresInSec: 3600 });

      const { deletedCount } = await cleanupExpiredAuthVerifications();

      expect(deletedCount).toBe(1);

      const remaining = await prisma.authVerification.count();
      expect(remaining).toBe(1);
    });
  });
});
