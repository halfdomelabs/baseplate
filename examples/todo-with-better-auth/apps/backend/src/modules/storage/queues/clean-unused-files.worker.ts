import { bindQueueHandler } from '@src/types/queue.types.js';

import { cleanUnusedFiles } from '../services/clean-unused-files.js';
import { cleanUnusedFilesQueue } from './clean-unused-files.queue.js';

export const cleanUnusedFilesWorker = bindQueueHandler(cleanUnusedFilesQueue, {
  handler: async () => {
    const result = await cleanUnusedFiles();
    return { numDeleted: result };
  },
  repeatable: {
    pattern: '5 * * * *',
  },
});
