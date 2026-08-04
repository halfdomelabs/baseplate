import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { QueueService } from '@src/types/queue.types.js';

import { prisma } from '@src/services/prisma.js';

import type { NotificationChannel } from '../channels/types.js';
import type { NotificationMode } from '../constants/notification-topics.js';

import { defineNotificationType } from '../registry.js';
import { GENERIC_NOTIFICATION_TYPE } from './generic-type.js';
import { createNotificationOutbox } from './notification-outbox.js';
import { createNotificationRenderer } from './notification-renderer.js';
import { createNotificationService } from './notification.service.js';

/**
 * Exercises how preference rows narrow a fan-out's routing.
 *
 * The distinction that matters in v5 is topic membership: a type in a topic
 * reads that topic's rows, and a type in no topic reads nothing at all. That is
 * what replaced v4's `mandatory` flag and its category-gates-type rule.
 */

/** Routes to both mechanisms, so one test can observe in-app and outbound. */
const BOTH_CHANNELS_TYPE = defineNotificationType({
  ...GENERIC_NOTIFICATION_TYPE,
  channels: ['inApp', 'email'],
});

/**
 * The same routing, but belonging to no topic — the v5 way to say "delivery is
 * not the user's choice".
 */
const TOPICLESS_TYPE = defineNotificationType({
  ...BOTH_CHANNELS_TYPE,
  topic: undefined,
});

function createFakeQueue(): QueueService {
  return {
    enqueue: vi.fn<QueueService['enqueue']>(() => Promise.resolve('job-id')),
    enqueueBulk: vi.fn<QueueService['enqueueBulk']>((_token, jobs) =>
      Promise.resolve(jobs.map(() => 'job-id')),
    ),
  };
}

const noopChannel: NotificationChannel = { deliver: () => Promise.resolve() };

function createService(): ReturnType<typeof createNotificationService> {
  return createNotificationService({
    events: {
      publishUnseenCount: vi.fn(),
      subscribeToUnseenCount: vi.fn(),
    },
    renderer: createNotificationRenderer({
      notificationTypes: [GENERIC_NOTIFICATION_TYPE],
    }),
    outbox: createNotificationOutbox({
      channels: { email: noopChannel },
      queue: createFakeQueue(),
    }),
  });
}

async function createUser(label: string): Promise<string> {
  const user = await prisma.user.create({
    data: { email: `prefs-${label}@example.com` },
  });
  return user.id;
}

/** Writes one sparse override row. */
async function setPreference(options: {
  userId: string;
  topicKey: string;
  channel: string;
  mode: NotificationMode;
  digestWindowSeconds?: number;
}): Promise<void> {
  await prisma.notificationPreference.create({ data: options });
}

/** The routing actually persisted for a recipient, as row + delivery channels. */
async function readRouting(
  requestId: string,
  recipientId: string,
): Promise<{ inApp: boolean; outbound: string[] }> {
  const row = await prisma.notification.findFirstOrThrow({
    where: { requestId, recipientId },
    select: { id: true, inApp: true },
  });
  const deliveries = await prisma.notificationDelivery.findMany({
    where: { notificationId: row.id },
    select: { channel: true },
  });
  return {
    inApp: row.inApp,
    outbound: deliveries.map((delivery) => delivery.channel).toSorted(),
  };
}

async function resetTables(): Promise<void> {
  await prisma.notification.deleteMany();
  await prisma.notificationRequest.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.user.deleteMany();
}

describe('notification preferences', () => {
  beforeEach(resetTables);
  afterAll(resetTables);

  it('falls back to the topic defaults when the user has no rows', async () => {
    const userId = await createUser('default');
    const service = createService();

    const { requestId } = await service.notifyMany(BOTH_CHANNELS_TYPE, {
      recipientIds: [userId],
      params: { text: 'hello' },
    });

    // `general` defaults both channels to immediate.
    expect(await readRouting(requestId, userId)).toEqual({
      inApp: true,
      outbound: ['email'],
    });
  });

  it('lets a topic row override the default in both directions', async () => {
    const off = await createUser('topic-off');
    const on = await createUser('topic-on');
    await setPreference({
      userId: off,
      topicKey: 'general',
      channel: 'inApp',
      mode: 'off',
    });
    await setPreference({
      userId: on,
      topicKey: 'general',
      channel: 'email',
      mode: 'off',
    });
    const service = createService();

    const { requestId } = await service.notifyMany(BOTH_CHANNELS_TYPE, {
      recipientIds: [off, on],
      params: { text: 'hello' },
    });

    expect(await readRouting(requestId, off)).toEqual({
      inApp: false,
      outbound: ['email'],
    });
    expect(await readRouting(requestId, on)).toEqual({
      inApp: true,
      outbound: [],
    });
  });

  it('never reads preferences for a topic-less type', async () => {
    const userId = await createUser('topicless');
    // Opted out of every channel of every topic — and it makes no difference,
    // because this type belongs to none of them.
    for (const channel of ['inApp', 'email']) {
      await setPreference({
        userId,
        topicKey: 'general',
        channel,
        mode: 'off',
      });
    }
    const service = createService();

    const { requestId } = await service.notifyMany(TOPICLESS_TYPE, {
      recipientIds: [userId],
      params: { text: 'hello' },
    });

    expect(await readRouting(requestId, userId)).toEqual({
      inApp: true,
      outbound: ['email'],
    });
  });

  it('ignores rows belonging to another user or another topic', async () => {
    const userId = await createUser('unaffected');
    const other = await createUser('other');
    await setPreference({
      userId: other,
      topicKey: 'general',
      channel: 'inApp',
      mode: 'off',
    });
    const service = createService();

    const { requestId } = await service.notifyMany(BOTH_CHANNELS_TYPE, {
      recipientIds: [userId],
      params: { text: 'hello' },
    });

    expect(await readRouting(requestId, userId)).toEqual({
      inApp: true,
      outbound: ['email'],
    });
  });

  it('cannot widen routing past the type’s own channels', async () => {
    const userId = await createUser('ceiling');
    // The topic allows email, but the type does not route there — the type's
    // `channels` is a ceiling a preference can narrow but never raise.
    const inAppOnly = defineNotificationType({
      ...GENERIC_NOTIFICATION_TYPE,
      channels: ['inApp'],
    });
    await setPreference({
      userId,
      topicKey: 'general',
      channel: 'email',
      mode: 'immediate',
    });
    const service = createService();

    const { requestId } = await service.notifyMany(inAppOnly, {
      recipientIds: [userId],
      params: { text: 'hello' },
    });

    expect(await readRouting(requestId, userId)).toEqual({
      inApp: true,
      outbound: [],
    });
  });

  it('still writes a row for a recipient who silenced every channel', async () => {
    const userId = await createUser('silenced');
    for (const channel of ['inApp', 'email']) {
      await setPreference({
        userId,
        topicKey: 'general',
        channel,
        mode: 'off',
      });
    }
    const service = createService();

    const { requestId, createdCount } = await service.notifyMany(
      BOTH_CHANNELS_TYPE,
      { recipientIds: [userId], params: { text: 'hello' } },
    );

    // The "one row per recipient regardless of channel" invariant holds: the
    // row exists with `inApp: false` and no deliveries.
    expect(createdCount).toBe(1);
    expect(await readRouting(requestId, userId)).toEqual({
      inApp: false,
      outbound: [],
    });
  });
});

describe('notification preference writes', () => {
  beforeEach(resetTables);
  afterAll(resetTables);

  it('upserts rather than duplicating when a choice is changed', async () => {
    const userId = await createUser('upsert');
    const service = createService();
    const scope = { topicKey: 'general', channel: 'email' as const };

    await service.setPreference(userId, { ...scope, mode: 'immediate' });
    await service.setPreference(userId, { ...scope, mode: 'off' });

    const rows = await prisma.notificationPreference.findMany({
      where: { userId },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.mode).toBe('off');
  });

  it('rejects an unknown topic', async () => {
    const userId = await createUser('validation');
    const service = createService();

    await expect(
      service.setPreference(userId, {
        topicKey: 'comnents',
        channel: 'inApp',
        mode: 'off',
      }),
    ).rejects.toThrow(/Unknown notification topic/);
  });

  it('rejects a digest on the feed, which has no window to batch over', async () => {
    const userId = await createUser('digest-inapp');
    const service = createService();

    await expect(
      service.setPreference(userId, {
        topicKey: 'general',
        channel: 'inApp',
        mode: 'digest',
      }),
    ).rejects.toThrow(/cannot be digested/);
  });

  it('stores a digest window only while the mode is digest', async () => {
    const userId = await createUser('digest-window');
    const service = createService();
    const scope = { topicKey: 'general', channel: 'email' as const };

    await service.setPreference(userId, {
      ...scope,
      mode: 'digest',
      digestWindowSeconds: 3600,
    });
    expect(
      (
        await prisma.notificationPreference.findFirstOrThrow({
          where: { userId },
        })
      ).digestWindowSeconds,
    ).toBe(3600);

    // Switching away clears it, so going back to digest does not resurrect a
    // window the user never chose again.
    await service.setPreference(userId, { ...scope, mode: 'immediate' });
    expect(
      (
        await prisma.notificationPreference.findFirstOrThrow({
          where: { userId },
        })
      ).digestWindowSeconds,
    ).toBeNull();
  });

  it('clears only the caller’s own row', async () => {
    const owner = await createUser('owner');
    const other = await createUser('bystander');
    const service = createService();
    const scope = { topicKey: 'general', channel: 'inApp' as const };
    await service.setPreference(owner, { ...scope, mode: 'off' });
    await service.setPreference(other, { ...scope, mode: 'off' });

    expect(await service.clearPreference(owner, scope)).toBe(true);
    // Clearing again is a no-op, not an error.
    expect(await service.clearPreference(owner, scope)).toBe(false);

    // The bystander's identical tuple is untouched.
    expect(
      await prisma.notificationPreference.count({ where: { userId: other } }),
    ).toBe(1);
  });

  it('restores the topic default once a choice is cleared', async () => {
    const userId = await createUser('restore');
    const service = createService();
    const scope = { topicKey: 'general', channel: 'inApp' as const };

    await service.setPreference(userId, { ...scope, mode: 'off' });
    const silenced = await service.notifyMany(BOTH_CHANNELS_TYPE, {
      recipientIds: [userId],
      params: { text: 'hello' },
    });
    expect((await readRouting(silenced.requestId, userId)).inApp).toBe(false);

    await service.clearPreference(userId, scope);
    const restored = await service.notifyMany(BOTH_CHANNELS_TYPE, {
      recipientIds: [userId],
      params: { text: 'hello' },
    });
    expect((await readRouting(restored.requestId, userId)).inApp).toBe(true);
  });

  it('reports resolved state, marking which channels came from the default', async () => {
    const userId = await createUser('resolved');
    const service = createService();
    await service.setPreference(userId, {
      topicKey: 'general',
      channel: 'email',
      mode: 'off',
    });

    const preferences = await service.getPreferences(userId);
    // Positional rather than a key lookup: `general` is currently the only
    // declared topic, so comparing against its key is statically true.
    const [general] = preferences;

    const email = general?.channels.find((c) => c.channel === 'email');
    const inApp = general?.channels.find((c) => c.channel === 'inApp');

    // The written row is reported as an override; the untouched channel is
    // reported as still sitting on the topic default.
    expect(email).toMatchObject({ mode: 'off', isDefault: false });
    expect(inApp).toMatchObject({ mode: 'immediate', isDefault: true });
  });
});
