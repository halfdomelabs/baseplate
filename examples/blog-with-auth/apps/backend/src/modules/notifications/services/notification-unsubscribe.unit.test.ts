import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSigner } from '@src/services/app-secret.js';

import type { NotificationService } from './notification.service.js';

import {
  applyUnsubscribeLink,
  buildUnsubscribeUrl,
  parseUnsubscribeLink,
  UNSUBSCRIBE_TOKEN_PARAM,
} from './notification-unsubscribe.js';

const config = {
  APP_SECRET: '',
  APP_SECRET_PREVIOUS: '',
  API_URL: 'https://api.example.com',
};

vi.mock('@src/services/config.js', () => ({ getConfig: () => config }));

/** Recipients the database still holds; the rest have been deleted. */
const existingUserIds = new Set<string>();

vi.mock('@src/services/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: ({ where }: { where: { id: string } }) =>
        Promise.resolve(
          existingUserIds.has(where.id) ? { id: where.id } : null,
        ),
    },
  },
}));

const FIRST_SECRET = 'first-secret-with-at-least-32-characters';
const SECOND_SECRET = 'second-secret-with-at-least-32-character';

/** Retires the current secret and installs a new one, as a real rotation would. */
function rotateTo(secret: string): void {
  config.APP_SECRET_PREVIOUS = [config.APP_SECRET, config.APP_SECRET_PREVIOUS]
    .filter(Boolean)
    .join(',');
  config.APP_SECRET = secret;
}

/** The token a built URL carries. */
function tokenIn(url: string | undefined): string {
  return new URL(url ?? '').searchParams.get(UNSUBSCRIBE_TOKEN_PARAM) ?? '';
}

beforeEach(() => {
  config.APP_SECRET = FIRST_SECRET;
  config.APP_SECRET_PREVIOUS = '';
  existingUserIds.clear();
  existingUserIds.add('user-1');
});

describe('buildUnsubscribeUrl', () => {
  it('covers every topic with one token on the API origin', () => {
    const url = buildUnsubscribeUrl('user-1', ['general', 'postComments']);

    expect(url).toContain('https://api.example.com/notifications/unsubscribe?');
    expect(parseUnsubscribeLink(tokenIn(url))).toEqual({
      userId: 'user-1',
      topicKeys: ['general', 'postComments'],
    });
  });

  it('yields no URL when the mail covers no topic', () => {
    // A topic-less type is unsuppressible by design, so there is nothing to
    // offer — the header and the body link are both absent together.
    expect(buildUnsubscribeUrl('user-1', [])).toBeUndefined();
  });
});

describe('parseUnsubscribeLink', () => {
  it('rejects a tampered payload', () => {
    // A holder must not be able to widen a link to topics the mail never
    // contained.
    const token = tokenIn(buildUnsubscribeUrl('user-1', ['general']));
    const [id, , mac] = token.split('.');
    const forged = Buffer.from(
      JSON.stringify({ userId: 'user-1', topicKeys: ['general', 'postLikes'] }),
    ).toString('base64url');

    expect(parseUnsubscribeLink(`${id}.${forged}.${mac}`)).toBeNull();
  });

  it('rejects a token signed for another purpose', () => {
    const otherPurpose = createSigner<{ userId: string; topicKeys: string[] }>(
      'notifications:something-else:v1',
      { accept: 'all' },
    );

    expect(
      parseUnsubscribeLink(
        otherPurpose.sign({ userId: 'user-1', topicKeys: ['general'] }),
      ),
    ).toBeNull();
  });

  it('drops topics the project no longer declares', () => {
    // A token outlives the topic list it was minted against, and still verifies.
    const stale = createSigner<{ userId: string; topicKeys: string[] }>(
      'notifications:unsubscribe:v1',
      { accept: 'all' },
    );

    expect(
      parseUnsubscribeLink(
        stale.sign({ userId: 'user-1', topicKeys: ['retired', 'general'] }),
      ),
    ).toEqual({ userId: 'user-1', topicKeys: ['general'] });
  });

  it('rejects a link left covering no topic at all', () => {
    const stale = createSigner<{ userId: string; topicKeys: string[] }>(
      'notifications:unsubscribe:v1',
      { accept: 'all' },
    );

    expect(
      parseUnsubscribeLink(
        stale.sign({ userId: 'user-1', topicKeys: ['gone'] }),
      ),
    ).toBeNull();
  });

  it('rejects a payload that no longer matches the expected shape', () => {
    // These tokens never expire, so an older payload shape must be rejected
    // rather than mis-read.
    const old = createSigner<{ userId: string }>(
      'notifications:unsubscribe:v1',
      {
        accept: 'all',
      },
    );

    expect(parseUnsubscribeLink(old.sign({ userId: 'user-1' }))).toBeNull();
  });

  it('ignores a value that is not a token at all', () => {
    expect(parseUnsubscribeLink('not-a-token')).toBeNull();
    expect(parseUnsubscribeLink(undefined)).toBeNull();
  });

  it('still verifies a token minted before APP_SECRET was rotated', () => {
    // Why the signer accepts every generation: a link in an old email must
    // still work.
    const token = tokenIn(buildUnsubscribeUrl('user-1', ['general']));

    rotateTo(SECOND_SECRET);

    expect(parseUnsubscribeLink(token)).toEqual({
      userId: 'user-1',
      topicKeys: ['general'],
    });
  });
});

describe('applyUnsubscribeLink', () => {
  it('turns email off for each topic the link covers', async () => {
    const setPreference = vi.fn(() => Promise.resolve());
    const notification = { setPreference } as unknown as NotificationService;

    await applyUnsubscribeLink(notification, {
      userId: 'user-1',
      topicKeys: ['general', 'postLikes'],
    });

    expect(setPreference).toHaveBeenCalledTimes(2);
    expect(setPreference).toHaveBeenNthCalledWith(1, 'user-1', {
      topicKey: 'general',
      channel: 'email',
      mode: 'off',
    });
  });

  it('writes nothing for a recipient who no longer exists', async () => {
    // The link outlived the account, so the write is never attempted.
    const setPreference = vi.fn(() => Promise.resolve());
    const notification = { setPreference } as unknown as NotificationService;

    await applyUnsubscribeLink(notification, {
      userId: 'deleted-user',
      topicKeys: ['general'],
    });

    expect(setPreference).not.toHaveBeenCalled();
  });

  it('lets a failure through rather than reporting success', async () => {
    // Swallowing here would report success on a database outage.
    const notification = {
      setPreference: vi.fn(() => Promise.reject(new Error('connection lost'))),
    } as unknown as NotificationService;

    await expect(
      applyUnsubscribeLink(notification, {
        userId: 'user-1',
        topicKeys: ['general'],
      }),
    ).rejects.toThrow('connection lost');
  });
});
