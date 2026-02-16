import { createQueue } from '@src/services/bullmq.service.js';

import { cleanUnusedFiles } from '../services/clean-unused-files.js';

export const cleanUnusedFilesQueue = createQueue('clean-unused-files', {
  handler: async () => {
    const result = await cleanUnusedFiles();
    return { numDeleted: result };
  },
  repeatable: {
    pattern: '5 * * * *',
  },
});
