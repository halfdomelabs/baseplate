// @ts-nocheck

import type { StorageAdapterKey } from '$configAdapters';
import type { StorageAdapter } from '$typesAdapter';

import { STORAGE_ADAPTERS } from '$configAdapters';

/**
 * Retrieves a storage adapter by name, throwing an error if not found.
 *
 * @param adapterName - The name of the storage adapter to retrieve
 * @returns The storage adapter instance
 * @throws {Error} If the adapter name is not found in the registered adapters
 */
export function getAdapterOrThrow(adapterName: string): StorageAdapter {
  if (!(adapterName in STORAGE_ADAPTERS)) {
    throw new Error(
      `Unknown storage adapter: "${adapterName}". Available adapters: ${Object.keys(STORAGE_ADAPTERS).join(', ')}`,
    );
  }
  return STORAGE_ADAPTERS[adapterName as StorageAdapterKey];
}
