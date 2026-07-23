import type { Notification, Prisma } from '@src/generated/prisma/client.js';

import { getPubSub } from '@src/plugins/graphql/pubsub.js';
import { logError } from '@src/services/error-logger.js';
import { prisma } from '@src/services/prisma.js';

import type {
  NotificationChannelKey,
  ResolvedNotification,
} from './notification-channel.js';
import type {
  NotificationParams,
  RenderContext,
  RenderedContent,
} from './notification-content.js';
import type {
  NotificationEvent,
  NotificationTypeDefinition,
} from './notification-registry.js';

import { GENERIC_NOTIFICATION_TYPE } from './generic-type.js';
import { getChannel } from './notification-channel.js';
import {
  isSafeUrl,
  notificationSegmentsSchema,
  segmentsToText,
  toSegments,
} from './notification-content.js';
import { getNotificationType } from './notification-registry.js';

/** Default render locale until i18n lands. */
const DEFAULT_LOCALE = 'en';

/** Columns `renderContent` reads; the GraphQL field spreads this into its `select`. */
export const RENDER_SOURCE_SELECT = {
  id: true,
  type: true,
  templateVersion: true,
  params: true,
  segments: true,
  fallbackText: true,
  actionUrl: true,
  actorId: true,
  entityType: true,
  entityId: true,
} satisfies Prisma.NotificationSelect;

/** Row shape `renderContent` accepts (feed/notify rows are supersets). */
export type RenderSource = Prisma.NotificationGetPayload<{
  select: typeof RENDER_SOURCE_SELECT;
}>;

/**
 * The frozen snapshot persisted at notify time — the recovery content used when
 * the row's renderer is gone or its params no longer validate. Parsed, not cast:
 * the DB guarantees no shape.
 */
function frozenContent(row: RenderSource): RenderedContent {
  const parsed = notificationSegmentsSchema.safeParse(row.segments);
  return {
    segments: parsed.success ? parsed.data : [],
    fallbackText: row.fallbackText,
    actionUrl: row.actionUrl,
  };
}

/**
 * Render a row's content at read time, ATOMICALLY: segments, fallbackText and
 * actionUrl all come from a single invocation of the renderer that CREATED the
 * row — resolved by `(type, templateVersion)`, never "whatever is deployed now".
 * A copy/param refactor bumps the version, so history can't be silently rewritten.
 *
 * Falls back to the frozen snapshot (and logs) when the pinned renderer is gone
 * or the stored params no longer satisfy it.
 */
export function renderContent(
  row: RenderSource,
  ctx?: RenderContext,
): RenderedContent {
  const type = getNotificationType(row.type, row.templateVersion);
  if (!type) {
    logError(
      new Error(
        `No renderer for notification "${row.type}@${row.templateVersion}"`,
      ),
      { source: 'notification-render', notificationId: row.id },
    );
    return frozenContent(row);
  }

  const params = type.paramsSchema.safeParse(row.params ?? {});
  if (!params.success) {
    logError(params.error, {
      source: 'notification-render',
      reason: 'params-drift',
      notificationId: row.id,
      type: `${row.type}@${row.templateVersion}`,
    });
    return frozenContent(row);
  }

  const event: NotificationEvent = {
    recipientId: '', // not needed to render the body
    params: params.data,
    actorId: row.actorId ?? undefined,
    entityType: row.entityType ?? undefined,
    entityId: row.entityId ?? undefined,
  };

  try {
    return toRenderedContent(
      type.render([event], ctx ?? { locale: DEFAULT_LOCALE }),
    );
  } catch (error) {
    logError(error, {
      source: 'notification-render',
      reason: 'render-threw',
      notificationId: row.id,
      type: `${row.type}@${row.templateVersion}`,
    });
    return frozenContent(row);
  }
}

/** Project a renderer's output into the served content (one render, all fields). */
function toRenderedContent(
  content: ReturnType<NotificationTypeDefinition['render']>,
): RenderedContent {
  const segments = toSegments(content.body);
  const actionUrl =
    content.actionUrl && isSafeUrl(content.actionUrl)
      ? content.actionUrl
      : null;
  return {
    segments,
    fallbackText: segmentsToText(segments),
    actionUrl,
  };
}

/** Actor columns from the input (human actors; live name/avatar via the relation). */
function actorColumns(actorId: string | undefined): {
  actorKind: string;
  actorId: string | null;
} {
  return actorId
    ? { actorKind: 'user', actorId }
    : { actorKind: 'none', actorId: null };
}

/** Input to trigger a notification. The type is the definition, not a key. */
export interface NotifyInput<P extends NotificationParams> {
  recipientId: string;
  params: P;
  actorId?: string;
  /** Polymorphic subject reference (no FK). */
  entityType?: string;
  entityId?: string;
}

/**
 * Trigger a notification. Takes the definition itself, so `params` are checked
 * against the renderer that will consume them.
 *
 * Persists the render-source `params` plus a frozen snapshot (the read-time
 * recovery content), then dispatches to the type's channels.
 */
export async function notify<P extends NotificationParams>(
  type: NotificationTypeDefinition<P>,
  input: NotifyInput<P>,
): Promise<Notification> {
  // Fail fast at WRITE: params that don't satisfy the schema would otherwise
  // persist a row that silently falls back to frozen content on every read.
  const params = type.paramsSchema.parse(input.params);

  // A single event today. The digest engine will pass N.
  const event: NotificationEvent<P> = {
    recipientId: input.recipientId,
    params,
    actorId: input.actorId,
    entityType: input.entityType,
    entityId: input.entityId,
  };

  // Freeze a default-locale snapshot as the read-time recovery content.
  const frozen = toRenderedContent(
    type.render([event], { locale: DEFAULT_LOCALE }),
  );

  const row = await prisma.notification.create({
    data: {
      type: type.key,
      templateVersion: type.version,
      recipientId: input.recipientId,
      // Render source, replayed at read time.
      params: params as Prisma.InputJsonValue,
      // Recovery content for a retired renderer / param drift.
      segments: frozen.segments as unknown as Prisma.InputJsonValue,
      fallbackText: frozen.fallbackText,
      actionUrl: frozen.actionUrl,
      ...actorColumns(input.actorId),
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
    },
  });

  await dispatchToChannels(type.channels, {
    ...frozen,
    notificationId: row.id,
    type: row.type,
    recipientId: input.recipientId,
  });

  return row;
}

/** Options for the `notifyText` one-off sugar. */
export interface NotifyTextOptions {
  actionUrl?: string;
  actorId?: string;
}

/**
 * Send a plain-text notification without defining a type, via the built-in
 * `generic` type. For one-off notifications ("Your export is ready").
 */
export function notifyText(
  recipientId: string,
  text: string,
  options: NotifyTextOptions = {},
): Promise<Notification> {
  return notify(GENERIC_NOTIFICATION_TYPE, {
    recipientId,
    params: { text, actionUrl: options.actionUrl },
    actorId: options.actorId,
  });
}

/** Deliver to each of the type's channels; a channel that throws is logged, not rethrown. */
async function dispatchToChannels(
  channelKeys: readonly NotificationChannelKey[],
  resolved: ResolvedNotification,
): Promise<void> {
  const deliveries = channelKeys.map((channelKey) =>
    getChannel(channelKey).deliver(resolved),
  );
  const results = await Promise.allSettled(deliveries);
  for (const [i, result] of results.entries()) {
    if (result.status === 'rejected') {
      logError(result.reason, {
        source: 'notification-channel',
        channel: channelKeys[i],
        notificationId: resolved.notificationId,
      });
    }
  }
}

/**
 * Count of UNSEEN notifications — the bell badge. Seen (opening the panel) clears
 * the badge; read (clicking one) clears its highlight. `readAt` always implies
 * `seenAt` (see the read mutations), so this never counts a row already read.
 */
export async function getUnseenCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { recipientId: userId, seenAt: null },
  });
}

/** Result of a mutation that can change the unseen (badge) count. */
export interface UnseenCountResult {
  changed: boolean;
  /** The unseen count AFTER the change — the same value broadcast over pubsub. */
  unseenCount: number;
}

/**
 * Mark a notification read. Reading also marks it seen (a read row is never
 * unseen), so the badge can't count something already opened.
 */
export async function markAsRead(
  userId: string,
  notificationId: string,
): Promise<UnseenCountResult> {
  const now = new Date();
  const { count } = await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: userId, readAt: null },
    data: { readAt: now },
  });
  // Read implies seen: clear an unseen row's badge state in the same stroke.
  await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: userId, seenAt: null },
    data: { seenAt: now },
  });
  return {
    changed: count > 0,
    unseenCount: await publishUnseenCount(userId),
  };
}

/** Mark all of a user's unseen notifications seen (opening the bell). */
export async function markAllAsSeen(
  userId: string,
): Promise<{ changedCount: number; unseenCount: number }> {
  const { count } = await prisma.notification.updateMany({
    where: { recipientId: userId, seenAt: null },
    data: { seenAt: new Date() },
  });
  return {
    changedCount: count,
    unseenCount:
      count > 0
        ? await publishUnseenCount(userId)
        : await getUnseenCount(userId),
  };
}

/** Mark all of a user's notifications read (and therefore seen). */
export async function markAllAsRead(
  userId: string,
): Promise<{ changedCount: number; unseenCount: number }> {
  const now = new Date();
  const { count } = await prisma.notification.updateMany({
    where: { recipientId: userId, readAt: null },
    data: { readAt: now },
  });
  // Read implies seen.
  await prisma.notification.updateMany({
    where: { recipientId: userId, seenAt: null },
    data: { seenAt: now },
  });
  return {
    changedCount: count,
    unseenCount: await publishUnseenCount(userId),
  };
}

/** Delete a notification. `changed` is false if it didn't exist. */
export async function deleteNotification(
  userId: string,
  notificationId: string,
): Promise<UnseenCountResult> {
  const { count } = await prisma.notification.deleteMany({
    where: { id: notificationId, recipientId: userId },
  });
  return {
    changed: count > 0,
    unseenCount:
      count > 0
        ? await publishUnseenCount(userId)
        : await getUnseenCount(userId),
  };
}

/** Recompute, broadcast the change, and return the unseen count for a user. */
async function publishUnseenCount(userId: string): Promise<number> {
  const count = await getUnseenCount(userId);
  getPubSub().publish('notificationsChanged', userId, { count });
  return count;
}
