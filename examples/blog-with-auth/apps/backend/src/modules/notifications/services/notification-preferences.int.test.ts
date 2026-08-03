import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { QueueService } from '@src/types/queue.types.js';

import { prisma } from '@src/services/prisma.js';

import type { NotificationChannel } from './notification-channel.js';
import type { NotificationTypeDefinition } from './notification-registry.js';

import { GENERIC_NOTIFICATION_TYPE } from './generic-type.js';
import { createNotificationOutbox } from './notification-outbox.js';
import { createNotificationRenderer } from './notification-renderer.js';
import { createNotificationService } from './notification.service.js';

/**
 * Exercises how preference rows narrow a fan-out's routing.
 *
 * The matrix that matters is category-versus-type: a type row may only suppress
 * within an enabled category, never re-enable a disabled one, so a settings page
 * showing a category as off cannot be contradicted by a type row.
 */

/** Routes to both mechanisms, so one test can observe in-app and outbound. */
const BOTH_CHANNELS_TYPE: NotificationTypeDefinition<{ text: string }> = {
  ...GENERIC_NOTIFICATION_TYPE,
  channels: ['inApp', 'email'],
};

/** In the `security` category, which is declared mandatory. */
const MANDATORY_TYPE: NotificationTypeDefinition<{ text: string }> = {
  ...GENERIC_NOTIFICATION_TYPE,
  category: 'security',
  channels: ['inApp', 'email'],
};

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
  scopeKind: 'category' | 'type';
  scopeKey: string;
  channel: string;
  enabled: boolean;
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

  it('falls back to the category defaults when the user has no rows', async () => {
    const userId = await createUser('default');
    const service = createService();

    const { requestId } = await service.notifyMany(BOTH_CHANNELS_TYPE, {
      recipientIds: [userId],
      params: { text: 'hello' },
    });

    // `general` defaults to in-app only, so email is off despite the type
    // routing to it.
    expect(await readRouting(requestId, userId)).toEqual({
      inApp: true,
      outbound: [],
    });
  });

  it('lets a category row override the default in both directions', async () => {
    const off = await createUser('cat-off');
    const on = await createUser('cat-on');
    await setPreference({
      userId: off,
      scopeKind: 'category',
      scopeKey: 'general',
      channel: 'inApp',
      enabled: false,
    });
    await setPreference({
      userId: on,
      scopeKind: 'category',
      scopeKey: 'general',
      channel: 'email',
      enabled: true,
    });
    const service = createService();

    const { requestId } = await service.notifyMany(BOTH_CHANNELS_TYPE, {
      recipientIds: [off, on],
      params: { text: 'hello' },
    });

    expect(await readRouting(requestId, off)).toEqual({
      inApp: false,
      outbound: [],
    });
    expect(await readRouting(requestId, on)).toEqual({
      inApp: true,
      outbound: ['email'],
    });
  });

  it('lets a type row suppress within an enabled category', async () => {
    const userId = await createUser('type-off');
    await setPreference({
      userId,
      scopeKind: 'type',
      scopeKey: GENERIC_NOTIFICATION_TYPE.key,
      channel: 'inApp',
      enabled: false,
    });
    const service = createService();

    const { requestId } = await service.notifyMany(BOTH_CHANNELS_TYPE, {
      recipientIds: [userId],
      params: { text: 'hello' },
    });

    // The category still allows in-app; the type row is what silences it.
    expect(await readRouting(requestId, userId)).toEqual({
      inApp: false,
      outbound: [],
    });
  });

  it('does not let a type row re-enable a disabled category', async () => {
    const userId = await createUser('type-cannot-reenable');
    await setPreference({
      userId,
      scopeKind: 'category',
      scopeKey: 'general',
      channel: 'inApp',
      enabled: false,
    });
    await setPreference({
      userId,
      scopeKind: 'type',
      scopeKey: GENERIC_NOTIFICATION_TYPE.key,
      channel: 'inApp',
      enabled: true,
    });
    const service = createService();

    const { requestId } = await service.notifyMany(BOTH_CHANNELS_TYPE, {
      recipientIds: [userId],
      params: { text: 'hello' },
    });

    // The AND of the two scopes: category off wins, so the settings page cannot
    // be silently contradicted.
    expect(await readRouting(requestId, userId)).toEqual({
      inApp: false,
      outbound: [],
    });
  });

  it('ignores rows belonging to another user or another scope key', async () => {
    const userId = await createUser('unaffected');
    const other = await createUser('other');
    await setPreference({
      userId: other,
      scopeKind: 'category',
      scopeKey: 'general',
      channel: 'inApp',
      enabled: false,
    });
    // Same key, wrong discriminator — a category row must not be read as a type row.
    await setPreference({
      userId,
      scopeKind: 'type',
      scopeKey: 'general',
      channel: 'inApp',
      enabled: false,
    });
    const service = createService();

    const { requestId } = await service.notifyMany(BOTH_CHANNELS_TYPE, {
      recipientIds: [userId],
      params: { text: 'hello' },
    });

    expect(await readRouting(requestId, userId)).toEqual({
      inApp: true,
      outbound: [],
    });
  });

  it('ignores preference rows for a mandatory category', async () => {
    const userId = await createUser('mandatory');
    // Opted out of both scopes and both channels — and it makes no difference.
    for (const scope of [
      { scopeKind: 'category' as const, scopeKey: 'security' },
      { scopeKind: 'type' as const, scopeKey: GENERIC_NOTIFICATION_TYPE.key },
    ]) {
      for (const channel of ['inApp', 'email']) {
        await setPreference({ userId, ...scope, channel, enabled: false });
      }
    }
    const service = createService();

    const { requestId } = await service.notifyMany(MANDATORY_TYPE, {
      recipientIds: [userId],
      params: { text: 'hello' },
    });

    expect(await readRouting(requestId, userId)).toEqual({
      inApp: true,
      outbound: ['email'],
    });
  });

  it('still writes a row for a recipient who silenced every channel', async () => {
    const userId = await createUser('silenced');
    await setPreference({
      userId,
      scopeKind: 'category',
      scopeKey: 'general',
      channel: 'inApp',
      enabled: false,
    });
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
    const scope = {
      scopeKind: 'category' as const,
      scopeKey: 'general',
      channel: 'email' as const,
    };

    await service.setPreference(userId, { ...scope, enabled: true });
    await service.setPreference(userId, { ...scope, enabled: false });

    const rows = await prisma.notificationPreference.findMany({
      where: { userId },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.enabled).toBe(false);
  });

  it('rejects an unknown category but accepts an unregistered type', async () => {
    const userId = await createUser('validation');
    const service = createService();

    await expect(
      service.setPreference(userId, {
        scopeKind: 'category',
        scopeKey: 'comnents',
        channel: 'inApp',
        enabled: false,
      }),
    ).rejects.toThrow(/Unknown notification category/);

    // A type registered by a later deploy is legitimate — the row is inert
    // until something claims that key.
    await service.setPreference(userId, {
      scopeKind: 'type',
      scopeKey: 'post.liked',
      channel: 'inApp',
      enabled: false,
    });
    expect(
      await prisma.notificationPreference.count({ where: { userId } }),
    ).toBe(1);
  });

  it('clears only the caller’s own row', async () => {
    const owner = await createUser('owner');
    const other = await createUser('bystander');
    const service = createService();
    const scope = {
      scopeKind: 'category' as const,
      scopeKey: 'general',
      channel: 'inApp' as const,
    };
    await service.setPreference(owner, { ...scope, enabled: false });
    await service.setPreference(other, { ...scope, enabled: false });

    expect(await service.clearPreference(owner, scope)).toBe(true);
    // Clearing again is a no-op, not an error.
    expect(await service.clearPreference(owner, scope)).toBe(false);

    // The bystander's identical tuple is untouched.
    expect(
      await prisma.notificationPreference.count({ where: { userId: other } }),
    ).toBe(1);
  });

  it('restores the category default once a choice is cleared', async () => {
    const userId = await createUser('restore');
    const service = createService();
    const scope = {
      scopeKind: 'category' as const,
      scopeKey: 'general',
      channel: 'inApp' as const,
    };

    await service.setPreference(userId, { ...scope, enabled: false });
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

  it('reports resolved state, marking defaults and hiding mandatory channels', async () => {
    const userId = await createUser('resolved');
    const service = createService();
    await service.setPreference(userId, {
      scopeKind: 'category',
      scopeKey: 'general',
      channel: 'email',
      enabled: true,
    });

    const preferences = await service.getPreferences(userId);
    const general = preferences.find((entry) => entry.key === 'general');
    const security = preferences.find((entry) => entry.key === 'security');

    // `general` defaults to in-app only; email is the one overridden channel.
    expect(general?.channels).toEqual([
      { channel: 'inApp', enabled: true, isDefault: true },
      { channel: 'email', enabled: true, isDefault: false },
    ]);
    // Mandatory: no per-channel state, so a settings page cannot offer a toggle
    // that would do nothing.
    expect(security?.mandatory).toBe(true);
    expect(security?.channels).toBeUndefined();
  });

  it('does not surface type-scoped rows as category state', async () => {
    const userId = await createUser('type-scoped');
    const service = createService();
    await service.setPreference(userId, {
      scopeKind: 'type',
      scopeKey: GENERIC_NOTIFICATION_TYPE.key,
      channel: 'inApp',
      enabled: false,
    });

    const general = (await service.getPreferences(userId)).find(
      (entry) => entry.key === 'general',
    );

    // The settings page shows the category as still on — muting one type must
    // not read as having disabled the whole category.
    expect(general?.channels).toContainEqual({
      channel: 'inApp',
      enabled: true,
      isDefault: true,
    });
  });
});
