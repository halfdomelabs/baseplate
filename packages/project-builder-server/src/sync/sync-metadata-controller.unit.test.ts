import type { Logger } from '@halfdomelabs/sync';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PackageSyncInfo, SyncMetadata } from './sync-metadata.js';

import { SyncMetadataController } from './sync-metadata-controller.js';
import {
  readSyncMetadata,
  writeSyncMetadata,
} from './sync-metadata-service.js';

vi.mock('./sync-metadata-service.js');

describe('SyncMetadataController', () => {
  const mockProjectDirectory = '/test/project';
  const mockLogger: Logger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  };

  let controller: SyncMetadataController;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    controller = new SyncMetadataController(mockProjectDirectory, mockLogger);
    vi.mocked(writeSyncMetadata).mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const DEFAULT_METADATA: SyncMetadata = {
    status: 'in-progress',
    packages: {},
    startedAt: '2024-01-01',
    projectJsonHash: 'abc123',
  };

  describe('getMetadata', () => {
    it('should read metadata on first call and cache it', async () => {
      vi.mocked(readSyncMetadata).mockResolvedValue(DEFAULT_METADATA);

      const result1 = await controller.getMetadata();
      const result2 = await controller.getMetadata();

      expect(result1).toBe(DEFAULT_METADATA);
      expect(result2).toBe(DEFAULT_METADATA);
      expect(readSyncMetadata).toHaveBeenCalledTimes(1);
      expect(readSyncMetadata).toHaveBeenCalledWith(mockProjectDirectory);
    });

    it('should return undefined if no metadata exists', async () => {
      vi.mocked(readSyncMetadata).mockResolvedValue(undefined);

      const result = await controller.getMetadata();

      expect(result).toBeUndefined();
    });
  });

  describe('writeMetadata', () => {
    it('should write metadata and emit change event', () => {
      const mockMetadata = DEFAULT_METADATA;
      const changeListener = vi.fn();
      controller.on('sync-metadata-changed', changeListener);

      controller.writeMetadata(mockMetadata);

      // Advance the timer to trigger the throttled function
      vi.runAllTimers();

      expect(writeSyncMetadata).toHaveBeenCalledWith(
        mockProjectDirectory,
        mockMetadata,
      );
      expect(changeListener).toHaveBeenCalledWith(mockMetadata);
    });
  });

  describe('updateMetadataForPackage', () => {
    it('should update package metadata and write changes', async () => {
      const packageId = 'test-package';
      const initialMetadata: SyncMetadata = {
        ...DEFAULT_METADATA,
        packages: {
          [packageId]: {
            name: 'test',
            path: '/test',
            status: 'not-synced',
            order: 0,
          },
        },
      };
      vi.mocked(readSyncMetadata).mockResolvedValue(initialMetadata);
      await controller.getMetadata();

      const updateFn = (metadata: PackageSyncInfo): PackageSyncInfo => ({
        ...metadata,
        status: 'success' as const,
      });

      controller.updateMetadataForPackage(packageId, updateFn);

      vi.runAllTimers();

      expect(writeSyncMetadata).toHaveBeenCalledWith(mockProjectDirectory, {
        ...DEFAULT_METADATA,
        packages: {
          [packageId]: {
            name: 'test',
            path: '/test',
            status: 'success',
            order: 0,
          },
        },
      });
    });

    it('should throw error if no metadata exists', () => {
      const testFn = (): void => {
        controller.updateMetadataForPackage('test-package', (m) => m);
      };
      expect(testFn).toThrow('No metadata found');
    });

    it('should throw error if package not found', async () => {
      const initialMetadata: SyncMetadata = {
        ...DEFAULT_METADATA,
      };
      vi.mocked(readSyncMetadata).mockResolvedValue(initialMetadata);
      await controller.getMetadata();

      const testFn = (): void => {
        controller.updateMetadataForPackage('non-existent', (m) => m);
      };
      expect(testFn).toThrow('No package metadata found for non-existent');
    });
  });

  describe('updateMetadata', () => {
    it('should update metadata and write changes', async () => {
      const initialMetadata: SyncMetadata = {
        ...DEFAULT_METADATA,
      };
      vi.mocked(readSyncMetadata).mockResolvedValue(initialMetadata);
      await controller.getMetadata();

      const updateFn = (metadata: SyncMetadata): SyncMetadata => ({
        ...metadata,
        status: 'success',
        completedAt: '2024-01-01',
      });

      controller.updateMetadata(updateFn);

      vi.runAllTimers();

      expect(writeSyncMetadata).toHaveBeenCalledWith(mockProjectDirectory, {
        ...DEFAULT_METADATA,
        status: 'success',
        completedAt: '2024-01-01',
      });
    });
  });
});
