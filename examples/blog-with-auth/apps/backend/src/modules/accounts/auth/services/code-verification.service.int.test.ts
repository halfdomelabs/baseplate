import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@src/services/prisma.js';

import {
  consumeCodeVerification,
  createCodeVerification,
  validateCodeVerification,
} from './code-verification.service.js';

const TYPE = 'test-code';
const IDENTIFIER = 'test@example.com';

function create(
  code: string,
  overrides: { identifier?: string; expiresInSec?: number } = {},
): Promise<{ id: string }> {
  return createCodeVerification({
    type: TYPE,
    identifier: overrides.identifier ?? IDENTIFIER,
    code,
    expiresInSec: overrides.expiresInSec ?? 600,
  });
}

function validate(
  code: string,
  overrides: { maxAttempts?: number } = {},
): ReturnType<typeof validateCodeVerification> {
  return validateCodeVerification({
    type: TYPE,
    identifier: IDENTIFIER,
    code,
    maxAttempts: overrides.maxAttempts ?? 5,
  });
}

describe('code-verification service', () => {
  beforeEach(async () => {
    await prisma.authVerification.deleteMany();
  });

  afterAll(async () => {
    await prisma.authVerification.deleteMany();
  });

  describe('createCodeVerification', () => {
    it('stores the code keyed rather than in plaintext', async () => {
      await create('123456');

      const record = await prisma.authVerification.findFirstOrThrow({
        where: { type: TYPE },
      });
      expect(record.value).not.toContain('123456');
      expect(record.attempts).toBe(0);
    });

    it('keeps one outstanding code per identifier, invalidating the old one', async () => {
      await create('111111');
      await create('222222');

      expect(
        await prisma.authVerification.count({ where: { type: TYPE } }),
      ).toBe(1);
      expect(await validate('111111')).toBeNull();
      expect(await validate('222222')).not.toBeNull();
    });

    it('issues a new id per request so an older requester cannot redeem a newer code', async () => {
      const first = await create('111111');
      const second = await create('222222');

      // The whole point of the cookie binding: a browser holding the id from
      // the first request must not be able to redeem the second request's code.
      expect(second.id).not.toBe(first.id);

      const record = await validate('222222');
      expect(record?.id).toBe(second.id);
    });

    it('gives a replacement code a fresh attempt budget', async () => {
      await create('111111');
      await validate('000000');
      await validate('000000');

      await create('222222');

      const record = await prisma.authVerification.findFirstOrThrow({
        where: { type: TYPE },
      });
      expect(record.attempts).toBe(0);
    });

    it('scopes a code to the identifier it was issued for', async () => {
      await create('123456', { identifier: 'other@example.com' });

      expect(await validate('123456')).toBeNull();
    });
  });

  describe('validateCodeVerification', () => {
    it('returns the record without consuming it', async () => {
      const { id } = await create('123456');

      expect((await validate('123456'))?.id).toBe(id);
      expect((await validate('123456'))?.id).toBe(id);
    });

    it('counts each wrong guess and discards the code once the budget is spent', async () => {
      await create('123456');

      expect(await validate('000000', { maxAttempts: 3 })).toBeNull();
      expect(await validate('000000', { maxAttempts: 3 })).toBeNull();
      expect(
        (
          await prisma.authVerification.findFirstOrThrow({
            where: { type: TYPE },
          })
        ).attempts,
      ).toBe(2);

      expect(await validate('000000', { maxAttempts: 3 })).toBeNull();

      // Budget exhausted: the record is gone, so even the right code fails.
      expect(
        await prisma.authVerification.count({ where: { type: TYPE } }),
      ).toBe(0);
      expect(await validate('123456')).toBeNull();
    });

    it('counts simultaneous wrong guesses individually', async () => {
      await create('123456');

      await Promise.all(
        Array.from({ length: 4 }, () =>
          validate('000000', { maxAttempts: 10 }),
        ),
      );

      const record = await prisma.authVerification.findFirstOrThrow({
        where: { type: TYPE },
      });
      expect(record.attempts).toBe(4);
    });

    it('discards an expired code without matching it', async () => {
      await create('123456', { expiresInSec: -1 });

      expect(await validate('123456')).toBeNull();
      expect(
        await prisma.authVerification.count({ where: { type: TYPE } }),
      ).toBe(0);
    });
  });

  describe('consumeCodeVerification', () => {
    it('lets exactly one of several simultaneous claims win', async () => {
      const { id } = await create('123456');

      const results = await Promise.all(
        Array.from({ length: 5 }, () => consumeCodeVerification({ id })),
      );

      expect(results.filter(Boolean)).toHaveLength(1);
      expect(
        await prisma.authVerification.count({ where: { type: TYPE } }),
      ).toBe(0);
    });

    it('reports failure for an already-consumed code', async () => {
      const { id } = await create('123456');

      expect(await consumeCodeVerification({ id })).toBe(true);
      expect(await consumeCodeVerification({ id })).toBe(false);
    });

    it('leaves the code usable when the surrounding transaction rolls back', async () => {
      const { id } = await create('123456');

      await expect(
        prisma.$transaction(async (tx) => {
          expect(await consumeCodeVerification({ id, client: tx })).toBe(true);
          throw new Error('downstream failure');
        }),
      ).rejects.toThrow('downstream failure');

      expect((await validate('123456'))?.id).toBe(id);
    });
  });
});
