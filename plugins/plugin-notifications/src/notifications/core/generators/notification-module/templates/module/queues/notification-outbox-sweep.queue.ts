// @ts-nocheck

import { defineQueue } from '%queuesImports';

/** Drives the outbox sweep on a schedule. */
export const notificationOutboxSweepQueue = defineQueue<undefined>(
  'notification-outbox-sweep',
);
