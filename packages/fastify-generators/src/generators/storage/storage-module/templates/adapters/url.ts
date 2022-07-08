import { StorageAdapter } from './types';

/**
 * Minimal adapter that just converts path to URL directly.
 */
export const createUrlAdapter = (): StorageAdapter => ({
  getHostedUrl(path) {
    return path;
  },
});
