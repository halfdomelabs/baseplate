import type { Logger } from '@halfdomelabs/sync';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PackageSyncInfo, SyncMetadata } from './sync-metadata.js';

import { SyncMetadataController } from './sync-controller.js';
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

  describe('getMetadata', () => {
    it('should read metadata on first call and cache it', async () => {
      const mockMetadata: SyncMetadata = {
        packages: {},
      };
      vi.mocked(readSyncMetadata).mockResolvedValue(mockMetadata);

      const result1 = await controller.getMetadata();
      const result2 = await controller.getMetadata();

      expect(result1).toBe(mockMetadata);
      expect(result2).toBe(mockMetadata);
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
      const mockMetadata: SyncMetadata = {
        packages: {},
      };
      const changeListener = vi.fn();
      controller.on('syncMetadataChange', changeListener);

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
        packages: {
          [packageId]: {
            name: 'test',
            path: '/test',
            status: 'not-synced',
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
        packages: {
          [packageId]: {
            name: 'test',
            path: '/test',
            status: 'success',
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
        packages: {},
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
        packages: {},
      };
      vi.mocked(readSyncMetadata).mockResolvedValue(initialMetadata);
      await controller.getMetadata();

      const updateFn = (metadata: SyncMetadata): SyncMetadata => ({
        ...metadata,
        lastSyncResult: {
          status: 'success' as const,
          timestamp: '2024-01-01',
          projectJsonHash: 'abc123',
        },
      });

      controller.updateMetadata(updateFn);

      vi.runAllTimers();

      expect(writeSyncMetadata).toHaveBeenCalledWith(mockProjectDirectory, {
        packages: {},
        lastSyncResult: {
          status: 'success',
          timestamp: '2024-01-01',
          projectJsonHash: 'abc123',
        },
      });
    });
  });
});
