import { defineQueue } from '@src/types/queue.types.js';

export const cleanUnusedFilesQueue =
  defineQueue<undefined>('clean-unused-files');
