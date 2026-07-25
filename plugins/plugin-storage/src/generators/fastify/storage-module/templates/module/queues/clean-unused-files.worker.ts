// @ts-nocheck

import type { ServiceContextWith } from '%serviceContextImports';

import { cleanUnusedFilesQueue } from '$queuesCleanUnusedFiles';
import { cleanUnusedFiles } from '$servicesCleanUnusedFiles';
import { bindQueueHandler } from '%queuesImports';

export const cleanUnusedFilesWorker = bindQueueHandler(cleanUnusedFilesQueue, {
  handler: async (job, ctx: ServiceContextWith<'storage'>) => {
    const result = await cleanUnusedFiles(ctx);
    return { numDeleted: result };
  },
  repeatable: {
    pattern: '5 * * * *',
  },
});
