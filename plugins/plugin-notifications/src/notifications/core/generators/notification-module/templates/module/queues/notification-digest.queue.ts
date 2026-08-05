// @ts-nocheck

import { defineQueue } from '%queuesImports';

/** Drives the digest sweep on a schedule. */
export const notificationDigestQueue = defineQueue<undefined>(
  'notification-digest',
);
