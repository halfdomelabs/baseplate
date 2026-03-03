import type { Queue } from '../types/queue.types.js';

import { cleanUnusedFilesQueue } from '../modules/storage/queues/clean-unused-files.js';

/**
 * Central registry for all application queues.
 * Add new queues here as they are created.
 */

/**
 * Registry of all active queues in the application.
 */
export const QUEUE_REGISTRY: Queue<unknown>[] = /* TPL_QUEUE_LIST:START */ [
  cleanUnusedFilesQueue,
]; /* TPL_QUEUE_LIST:END */
