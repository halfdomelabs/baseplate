// @ts-nocheck

import { defineQueue } from '%queuesImports';

export const cleanupAuthVerificationQueue = defineQueue<undefined>(
  'cleanup-auth-verification',
);
