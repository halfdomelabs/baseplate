import type { ServiceContextWith } from '@src/utils/service-context.js';

import { bindQueueHandler } from '@src/types/queue.types.js';

import { cleanUnusedFiles } from '../services/clean-unused-files.js';
import { cleanUnusedFilesQueue } from './clean-unused-files.queue.js';

export const cleanUnusedFilesWorker = bindQueueHandler(cleanUnusedFilesQueue, {
  handler: async (job, ctx: ServiceContextWith<'storage'>) => {
    const result = await cleanUnusedFiles(ctx);
    return { numDeleted: result };
  },
  repeatable: {
    pattern: '5 * * * *',
  },
});
