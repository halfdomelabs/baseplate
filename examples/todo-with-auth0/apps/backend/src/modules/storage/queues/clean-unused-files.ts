import type { Queue, Worker } from 'bullmq';

import type { ManagedRepeatableJobsConfig } from '@src/services/bull/index.js';

import {
  createWorker,
  getOrCreateManagedQueue,
} from '@src/services/bull/index.js';

import { cleanUnusedFiles } from '../services/clean-unused-files.js';

const QUEUE_NAME = 'clean-unused-files';

export const getCleanUnusedFilesQueue = (): Queue =>
  getOrCreateManagedQueue(QUEUE_NAME);

export const cleanUnusedFilesRepeatableConfig: ManagedRepeatableJobsConfig = {
  getQueue: getCleanUnusedFilesQueue,
  jobs: [{ name: 'clean-files', pattern: '5 * * * *' }],
};

export const getCleanUnusedFilesWorker = (): Worker =>
  createWorker(QUEUE_NAME, async () => {
    const result = await cleanUnusedFiles();
    return { numDeleted: result };
  });
