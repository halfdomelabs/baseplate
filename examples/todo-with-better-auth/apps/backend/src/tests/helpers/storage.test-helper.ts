import type { Readable } from 'node:stream';

import type { StorageService } from '@src/modules/storage/services/storage.service.js';
import type {
  FileMetadata,
  StorageAdapter,
} from '@src/modules/storage/types/adapter.js';
import type { FileCategory } from '@src/modules/storage/types/file-category.js';

/**
 * Creates a storage adapter whose operations resolve without touching a
 * backing store. Override individual methods to control what a test observes.
 *
 * @param overrides Adapter methods to use instead of the inert defaults.
 * @returns A {@link StorageAdapter} suitable for tests.
 */
export function createFakeStorageAdapter(
  overrides: Partial<StorageAdapter> = {},
): StorageAdapter {
  // Fixed so metadata is deterministic across runs.
  const metadata: FileMetadata = {
    size: 0,
    contentType: 'application/octet-stream',
    lastModified: new Date(0),
  };

  return {
    uploadFile(): Promise<FileMetadata> {
      return Promise.resolve(metadata);
    },
    downloadFile(): Promise<Readable> {
      throw new Error('downloadFile is not implemented by the fake adapter.');
    },
    fileExists(): Promise<boolean> {
      return Promise.resolve(true);
    },
    getFileMetadata(): Promise<FileMetadata | null> {
      return Promise.resolve(metadata);
    },
    ...overrides,
  };
}

/**
 * Creates a storage service backed by fake adapters and the categories a test
 * supplies, so nothing resolves against real cloud storage.
 *
 * @param options Categories to register, the adapter every lookup returns, and
 * optionally per-name adapters for tests that assert on which one was used.
 * @returns A {@link StorageService} for tests.
 */
export function createFakeStorageService({
  categories = [],
  adapter = createFakeStorageAdapter(),
  adapters,
}: {
  categories?: FileCategory[];
  adapter?: StorageAdapter;
  adapters?: Partial<Record<string, StorageAdapter>>;
} = {}): StorageService {
  return {
    categories,
    getAdapterOrThrow(adapterName: string): StorageAdapter {
      if (!adapters) return adapter;
      const named = adapters[adapterName];
      if (!named) {
        throw new Error(`Unknown storage adapter: "${adapterName}"`);
      }
      return named;
    },
    getCategoryByName(name: string): FileCategory | undefined {
      return categories.find((category) => category.name === name);
    },
    getCategoryByNameOrThrow(name: string): FileCategory {
      const category = categories.find((item) => item.name === name);
      if (!category) {
        throw new Error(`Could not find file category ${name}`);
      }
      return category;
    },
  };
}
