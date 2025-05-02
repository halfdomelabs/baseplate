// @ts-nocheck

import { StorageAdapter } from './types.js';

/**
 * Minimal adapter that just converts path to URL directly.
 */
export const createUrlAdapter = (): StorageAdapter => ({
  getHostedUrl(path) {
    return path;
  },
  createPresignedDownloadUrl(path) {
    return Promise.resolve(path);
  },
});
