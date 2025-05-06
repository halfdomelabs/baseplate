import type { TestLogger } from '@halfdomelabs/sync';

import { createTestLogger } from '@halfdomelabs/sync';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  emitMockFsWatcherEvent,
  getMockFsWatchedFiles,
  MockFSWatcher,
  resetMockFsWatchers,
} from '../tests/chokidar.test-helper.js';
import { SyncMetadataController } from './sync-metadata-controller.js';
import {
  readSyncMetadata,
  writeSyncMetadata,
} from './sync-metadata-service.js';
import {
  INITIAL_SYNC_METADATA,
  type PackageSyncInfo,
  type SyncMetadata,
} from './sync-metadata.js';

vi.mock('./sync-metadata-service.js');
vi.mock('chokidar', () => ({
  watch: (paths: string | string[]) => new MockFSWatcher().add(paths),
}));

describe('SyncMetadataController', () => {
  const mockProjectDirectory = '/test/project';
  let mockLogger: TestLogger;

  let controller: SyncMetadataController;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockLogger = createTestLogger();
    controller = new SyncMetadataController(mockProjectDirectory, mockLogger);
    vi.mocked(writeSyncMetadata).mockResolvedValue();
    resetMockFsWatchers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getMetadata', () => {
    it('should read metadata on first call and cache it', async () => {
      vi.mocked(readSyncMetadata).mockResolvedValue(INITIAL_SYNC_METADATA);

      const result1 = await controller.getMetadata();
      const result2 = await controller.getMetadata();

      expect(result1).toBe(INITIAL_SYNC_METADATA);
      expect(result2).toBe(INITIAL_SYNC_METADATA);
      expect(readSyncMetadata).toHaveBeenCalledTimes(1);
      expect(readSyncMetadata).toHaveBeenCalledWith(mockProjectDirectory);
    });

    it('should handle invalid metadata', async () => {
      vi.mocked(readSyncMetadata).mockRejectedValue(
        new TypeError('Invalid JSON'),
      );

      const result = await controller.getMetadata();

      expect(result).toBe(INITIAL_SYNC_METADATA);
      expect(mockLogger.getWarnOutput()).toContain(
        'Invalid sync metadata found in /test/project/baseplate/.build/sync_result.json. Will use default metadata instead.',
      );
    });
  });

  describe('writeMetadata', () => {
    it('should write metadata and emit change event', () => {
      const changeListener = vi.fn();
      controller.on('sync-metadata-changed', changeListener);

      controller.writeMetadata(INITIAL_SYNC_METADATA);

      // Advance the timer to trigger the throttled function
      vi.runAllTimers();

      expect(writeSyncMetadata).toHaveBeenCalledWith(
        mockProjectDirectory,
        INITIAL_SYNC_METADATA,
      );
      expect(changeListener).toHaveBeenCalledWith(INITIAL_SYNC_METADATA);
    });
  });

  describe('updateMetadataForPackage', () => {
    it('should update package metadata and write changes', async () => {
      const packageId = 'test-package';
      const initialMetadata: SyncMetadata = {
        ...INITIAL_SYNC_METADATA,
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

      await controller.updateMetadataForPackage(packageId, updateFn);

      vi.runAllTimers();

      expect(writeSyncMetadata).toHaveBeenCalledWith(mockProjectDirectory, {
        ...INITIAL_SYNC_METADATA,
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
  });

  describe('updateMetadata', () => {
    it('should update metadata and write changes', async () => {
      vi.mocked(readSyncMetadata).mockResolvedValue(INITIAL_SYNC_METADATA);
      await controller.getMetadata();

      const updateFn = (metadata: SyncMetadata): SyncMetadata => ({
        ...metadata,
        status: 'success',
        completedAt: '2024-01-01',
      });

      await controller.updateMetadata(updateFn);

      vi.runAllTimers();

      expect(writeSyncMetadata).toHaveBeenCalledWith(mockProjectDirectory, {
        ...INITIAL_SYNC_METADATA,
        status: 'success',
        completedAt: '2024-01-01',
      });
    });
  });

  describe('watchMetadata', () => {
    it('should watch the metadata file and handle changes', async () => {
      const changeListener = vi.fn();
      controller.on('sync-metadata-changed', changeListener);

      const stopWatching = controller.watchMetadata();

      // Verify the watcher was set up correctly
      const watchedPaths = getMockFsWatchedFiles();
      expect(watchedPaths).toContain(
        '/test/project/baseplate/.build/sync_result.json',
      );

      // Simulate a file change
      const newMetadata: SyncMetadata = {
        ...INITIAL_SYNC_METADATA,
        status: 'success',
        completedAt: '2024-01-01',
      };
      vi.mocked(readSyncMetadata).mockResolvedValue(newMetadata);

      emitMockFsWatcherEvent(
        'change',
        '/test/project/baseplate/.build/sync_result.json',
      );
      await vi.runAllTimersAsync();

      expect(changeListener).toHaveBeenCalledWith(newMetadata);
      expect(readSyncMetadata).toHaveBeenCalledWith(mockProjectDirectory);

      // Clean up
      stopWatching();
    });

    it('should handle errors when reading metadata during watch', async () => {
      const changeListener = vi.fn();
      controller.on('sync-metadata-changed', changeListener);

      const stopWatching = controller.watchMetadata();

      // Simulate an error reading the metadata
      vi.mocked(readSyncMetadata).mockRejectedValue(new Error('Read error'));

      emitMockFsWatcherEvent(
        'change',
        '/test/project/baseplate/.build/sync_result.json',
      );
      await vi.runAllTimersAsync();

      expect(changeListener).not.toHaveBeenCalled();
      expect(mockLogger.getErrorOutput()).toContain('Error: Read error');

      // Clean up
      stopWatching();
    });
  });
});
