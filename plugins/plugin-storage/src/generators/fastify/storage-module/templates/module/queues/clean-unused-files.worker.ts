// @ts-nocheck

import { cleanUnusedFilesQueue } from '$queuesCleanUnusedFiles';
import { cleanUnusedFiles } from '$servicesCleanUnusedFiles';
import { bindQueueHandler } from '%queuesImports';

export const cleanUnusedFilesWorker = bindQueueHandler(cleanUnusedFilesQueue, {
  handler: async () => {
    const result = await cleanUnusedFiles();
    return { numDeleted: result };
  },
  repeatable: {
    pattern: '5 * * * *',
  },
});
