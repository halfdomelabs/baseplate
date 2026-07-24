// @ts-nocheck

import { cleanupAuthVerificationQueue } from '$queuesCleanupAuthVerification';
import { cleanupExpiredAuthVerifications } from '$servicesAuthVerification';
import { bindQueueHandler } from '%queuesImports';

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
