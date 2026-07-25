import { config } from '@src/services/config.js';

import type { StorageAdapter } from '../types/adapter.js';
import type { FileCategory } from '../types/file-category.js';

import { createS3Adapter } from '../adapters/s3.js';
import { createUrlAdapter } from '../adapters/url.js';

const STORAGE_ADAPTERS = /* TPL_ADAPTERS:START */ {
  uploads: createS3Adapter({
    bucket: config.AWS_UPLOADS_BUCKET,
    publicUrl: config.AWS_UPLOADS_URL,
    region: config.AWS_DEFAULT_REGION,
  }),
  url: createUrlAdapter(),
}; /* TPL_ADAPTERS:END */

export type StorageAdapterKey = keyof typeof STORAGE_ADAPTERS;

/**
 * Storage adapters and file categories, consumed via `services.storage`.
 * Categories are collected from `AppModule.storageCategories` at
 * construction and never re-exported for feature-code import.
 */
export interface StorageService {
  /**
   * Retrieves a storage adapter by name, throwing an error if not found.
   *
   * @param adapterName - The name of the storage adapter to retrieve
   * @returns The storage adapter instance
   * @throws {Error} If the adapter name is not found in the registered adapters
   */
  getAdapterOrThrow(adapterName: string): StorageAdapter;
  /**
   * Looks up a file category by name.
   *
   * @param name - The category name
   * @returns The category, or undefined if not found
   */
  getCategoryByName(name: string): FileCategory | undefined;
  /**
   * Looks up a file category by name, throwing an error if not found.
   *
   * @param name - The category name
   * @returns The category
   * @throws {Error} If no category with that name is registered
   */
  getCategoryByNameOrThrow(name: string): FileCategory;
  /** All registered file categories, e.g. for cleanup scans. */
  readonly categories: readonly FileCategory[];
}

/**
 * Creates the {@link StorageService}. Construction allocates adapter clients
 * (e.g. `S3Client`) but performs no I/O - requests are made lazily per call.
 *
 * @param categories - File categories collected from `AppModule.storageCategories`
 * @returns The storage service
 */
export function createStorageService(
  categories: readonly FileCategory[],
): StorageService {
  return {
    categories,
    getAdapterOrThrow(adapterName: string): StorageAdapter {
      if (!(adapterName in STORAGE_ADAPTERS)) {
        throw new Error(
          `Unknown storage adapter: "${adapterName}". Available adapters: ${Object.keys(STORAGE_ADAPTERS).join(', ')}`,
        );
      }
      return STORAGE_ADAPTERS[adapterName as StorageAdapterKey];
    },
    getCategoryByName(name: string): FileCategory | undefined {
      return categories.find((c) => c.name === name);
    },
    getCategoryByNameOrThrow(name: string): FileCategory {
      const category = categories.find((c) => c.name === name);
      if (!category) {
        throw new Error(`File category ${name} not found.`);
      }
      return category;
    },
  };
}
