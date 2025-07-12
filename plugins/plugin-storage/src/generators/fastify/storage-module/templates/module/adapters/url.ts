// @ts-nocheck

import type { Readable } from 'node:stream';

import axios from 'axios';

import type { StorageAdapter } from '../types/adapter.js';

/**
 * Minimal adapter that just converts path to URL directly.
 * This adapter is primarily useful for testing or when you want to use
 * external URLs as storage paths without actual file operations.
 */
export const createUrlAdapter = (): StorageAdapter => ({
  uploadFile: () =>
    Promise.reject(new Error('URL adapter does not support file uploads')),
  downloadFile: async (path: string): Promise<Readable> => {
    const response = await axios.get<Readable>(path, {
      responseType: 'stream',
      method: 'GET',
    });
    return response.data;
  },
  fileExists: () =>
    Promise.reject(
      new Error('URL adapter does not support file existence checks'),
    ),
  getFileMetadata: () =>
    Promise.reject(
      new Error('URL adapter does not support file metadata retrieval'),
    ),
  getPublicUrl: (path: string) => path,
  createPresignedDownloadUrl: (path: string) => Promise.resolve(path),
});
