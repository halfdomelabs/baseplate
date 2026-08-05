// @ts-nocheck

import type { SystemServiceContextWith } from '%serviceContextImports';

import { notificationDigestQueue } from '$queuesNotificationDigest';
import { bindQueueHandler } from '%queuesImports';

/**
 * (recipient, channel) pairs sent per pass. A larger backlog drains over
 * several runs rather than holding one worker for an unbounded stretch.
 */
const DIGEST_MAX_PAIRS_PER_PASS = 500;

/**
 * Sends digests whose window has closed, one message per (recipient, channel).
 *
 * A digest row is never enqueued individually — `completeFanout` skips it — so
 * this scan is the only thing that sends one. That is what lets a window
 * collapse across requests.
 *
 * The schedule is the delivery granularity, so a window is a floor rather than
 * a promise: a 15-minute window sends 15–20 minutes after the burst starts. Do
 * not read `digestDueAt` as a delivery time.
 */
export const notificationDigestWorker = bindQueueHandler(
  notificationDigestQueue,
  {
    handler: async (
      _job,
      ctx: SystemServiceContextWith<'notificationOutbox'>,
    ) =>
      ctx.services.notificationOutbox.sendDueDigests({
        dueBefore: new Date(),
        maxPairs: DIGEST_MAX_PAIRS_PER_PASS,
      }),
    repeatable: {
      // Offset so this misses the outbox sweep (7,17,...) and retention (42).
      pattern: '3,13,23,33,43,53 * * * *',
    },
  },
);
