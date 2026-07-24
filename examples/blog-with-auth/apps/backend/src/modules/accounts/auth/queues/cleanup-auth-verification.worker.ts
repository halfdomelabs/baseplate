import { bindQueueHandler } from '@src/types/queue.types.js';

import { cleanupExpiredAuthVerifications } from '../services/auth-verification.service.js';
import { cleanupAuthVerificationQueue } from './cleanup-auth-verification.queue.js';

/**
 * Periodic worker to clean up expired auth verification tokens.
 * Runs hourly to maintain database hygiene.
 */
export const cleanupAuthVerificationWorker = bindQueueHandler(
  cleanupAuthVerificationQueue,
  {
    handler: async () => {
      const result = await cleanupExpiredAuthVerifications();
      return { deletedCount: result.deletedCount };
    },
    repeatable: {
      pattern: '15 * * * *', // Every hour at minute 15
    },
  },
);
