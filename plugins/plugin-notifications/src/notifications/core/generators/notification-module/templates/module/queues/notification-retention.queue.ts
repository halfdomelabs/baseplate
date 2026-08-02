// @ts-nocheck

import { defineQueue } from '%queuesImports';

/** Drives the retention sweep on a schedule. */
export const notificationRetentionQueue = defineQueue<undefined>(
  'notification-retention',
);
