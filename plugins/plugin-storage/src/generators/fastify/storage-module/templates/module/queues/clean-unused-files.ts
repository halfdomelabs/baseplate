// @ts-nocheck

import { cleanUnusedFiles } from '$servicesCleanUnusedFiles';
import { createQueue } from '%queueServiceImports';

export const cleanUnusedFilesQueue = createQueue('clean-unused-files', {
  handler: async () => {
    const result = await cleanUnusedFiles();
    return { numDeleted: result };
  },
  repeatable: {
    pattern: '5 * * * *',
  },
});
