// @ts-nocheck

import { defineQueue } from '%queuesImports';

export const cleanUnusedFilesQueue =
  defineQueue<undefined>('clean-unused-files');
