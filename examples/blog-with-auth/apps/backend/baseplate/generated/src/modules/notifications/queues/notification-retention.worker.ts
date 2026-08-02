import type { SystemServiceContextWith } from '@src/utils/service-context.js';

import { bindQueueHandler } from '@src/types/queue.types.js';

import { notificationRetentionQueue } from './notification-retention.queue.js';

/** Rows per delete statement. */
const RETENTION_BATCH_SIZE = 500;

/**
 * Ceiling on one pass. A backlog larger than this drains over several runs
 * rather than holding locks for an unbounded stretch — the first run after a
 * project adopts retention is the one that would otherwise be huge.
 */
const RETENTION_MAX_DELETIONS = 10_000;

/**
 * How long a finished request is kept. Only dispatch state, so it outlives its
 * work by little — long enough that a sweep or a late replay can still find it.
 */
const REQUEST_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Deletes notifications past their retention horizon, then the finished
 * requests that dispatched them.
 *
 * Unbounded growth degrades the badge count, `markAllAsRead`, and the cascades
 * that hang off a notification, so rows are collected once every delivery they
 * own has settled. Requests are collected separately because `requestId` is
 * FK-less by design — nothing cascades them away with their notifications.
 *
 * Distinct from the outbox sweep, which re-runs interrupted fan-outs and
 * expires lost deliveries but never deletes anything.
 */
export const notificationRetentionWorker = bindQueueHandler(
  notificationRetentionQueue,
  {
    handler: async (
      _job,
      ctx: SystemServiceContextWith<'notificationOutbox'>,
    ) => {
      const outbox = ctx.services.notificationOutbox;

      const deletedCount = await outbox.deleteExpiredNotifications({
        expiredBefore: new Date(),
        batchSize: RETENTION_BATCH_SIZE,
        maxDeletions: RETENTION_MAX_DELETIONS,
      });

      const deletedRequestCount = await outbox.deleteCompletedRequests({
        createdBefore: new Date(Date.now() - REQUEST_RETENTION_MS),
        batchSize: RETENTION_BATCH_SIZE,
        maxDeletions: RETENTION_MAX_DELETIONS,
      });

      return { deletedCount, deletedRequestCount };
    },
    repeatable: {
      // Offset so this misses the outbox sweep and the other plugins' crons.
      pattern: '42 * * * *',
    },
  },
);
