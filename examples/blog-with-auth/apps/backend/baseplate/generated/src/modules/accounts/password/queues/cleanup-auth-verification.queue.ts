import { createQueue } from '@src/services/pg-boss.service.js';

import { cleanupExpiredAuthVerifications } from '../../services/auth-verification.service.js';

/**
 * Periodic queue to clean up expired auth verification tokens.
 * Runs hourly to maintain database hygiene.
 */
export const cleanupAuthVerificationQueue = createQueue(
  'cleanup-auth-verification',
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
