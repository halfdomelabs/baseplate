import { defineQueue } from '@src/types/queue.types.js';

export const cleanupAuthVerificationQueue = defineQueue<undefined>(
  'cleanup-auth-verification',
);
