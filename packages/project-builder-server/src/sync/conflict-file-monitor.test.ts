import type { Logger } from '@halfdomelabs/sync';

import { createTestLogger } from '@halfdomelabs/sync';
import { vol } from 'memfs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SyncMetadata } from './sync-metadata.js';

import {
  emitMockFsWatcherEvent,
  getMockFsWatchedFiles,
  MockFSWatcher,
  resetMockFsWatchers,
} from '../tests/chokidar.test-helper.js';
import { ConflictFileMonitor } from './conflict-file-monitor.js';
import { SyncMetadataController } from './sync-metadata-controller.js';

// Mock chokidar
vi.mock('node:fs');
vi.mock('node:fs/promises');
vi.mock('chokidar', () => ({
  watch: (paths: string | string[]) => new MockFSWatcher().add(paths),
}));

describe('ConflictFileMonitor', () => {
  const outputDirectory = '/test-output';
  let monitor: ConflictFileMonitor;
  let syncMetadataController: SyncMetadataController;
  let logger: Logger;

  beforeEach(() => {
    vol.reset();
    resetMockFsWatchers();
    logger = createTestLogger();
    syncMetadataController = new SyncMetadataController(
      outputDirectory,
      logger,
      { disableThrottling: true },
    );
    monitor = new ConflictFileMonitor(syncMetadataController, logger);
  });

  it('should start monitoring and handle metadata changes', async () => {
    // Set up initial metadata with conflicts
    const testPackagePath = path.join(outputDirectory, 'test-package');
    const initialMetadata: SyncMetadata = {
      status: 'in-progress',
      startedAt: new Date().toISOString(),
      packages: {
        'test-package': {
          name: 'test-package',
          path: testPackagePath,
          status: 'conflicts',
          result: {
            filesWithConflicts: [
              {
                relativePath: 'conflict.png',
                conflictType: 'merge-conflict',
                generatedConflictRelativePath: 'conflict.png.generated',
              },
              {
                relativePath: 'delete.txt',
                conflictType: 'generated-deleted',
              },
            ],
            completedAt: new Date().toISOString(),
          },
          order: 0,
        },
      },
    };

    syncMetadataController.writeMetadata(initialMetadata);

    // Start the monitor
    await monitor.start();

    // Verify watchers were added
    const watchedPaths = getMockFsWatchedFiles();
    expect(watchedPaths).toEqual([
      path.join(testPackagePath, 'conflict.png.generated'),
      path.join(testPackagePath, 'delete.txt'),
    ]);
  });

  it('should handle file changes and update metadata when conflicts are resolved', async () => {
    // Set up initial metadata with conflicts
    const testPackagePath = path.join(outputDirectory, 'test-package');
    const initialMetadata: SyncMetadata = {
      status: 'in-progress',
      startedAt: new Date().toISOString(),
      packages: {
        'test-package': {
          name: 'test-package',
          path: testPackagePath,
          status: 'conflicts',
          result: {
            filesWithConflicts: [
              {
                relativePath: 'conflict.txt',
                conflictType: 'merge-conflict',
              },
            ],
            completedAt: new Date().toISOString(),
          },
          order: 0,
        },
      },
    };

    // Mock the getMetadata method
    syncMetadataController.writeMetadata(initialMetadata);

    // Create the conflict file
    vol.fromJSON({
      [path.join(testPackagePath, 'conflict.txt')]:
        '<<<<<<< HEAD\nconflict\n>>>>>>> branch',
    });

    // Start the monitor
    await monitor.start();

    // Simulate file change event without any changes
    emitMockFsWatcherEvent(
      'change',
      path.join(testPackagePath, 'conflict.txt'),
    );
    // wait for event to propagate
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    // Verify metadata was not updated
    const noUpdateMetadata = await syncMetadataController.getMetadata();
    const noUpdatePackageInfo = noUpdateMetadata.packages['test-package'];
    expect(noUpdatePackageInfo.status).toBe('conflicts');
    expect(noUpdatePackageInfo.result?.filesWithConflicts).toHaveLength(1);

    // Simulate resolving the conflict
    await vol.promises.writeFile(
      path.join(testPackagePath, 'conflict.txt'),
      'resolved content',
    );

    // Simulate file change event
    emitMockFsWatcherEvent(
      'change',
      path.join(testPackagePath, 'conflict.txt'),
    );
    // wait for event to propagate
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    // Verify metadata was updated
    const updatedMetadata = await syncMetadataController.getMetadata();
    const updatedPackageInfo = updatedMetadata.packages['test-package'];
    expect(updatedPackageInfo.status).toBe('success');
    expect(updatedPackageInfo.result?.filesWithConflicts).toHaveLength(0);

    // Verify watchers were removed
    const watchedPaths = getMockFsWatchedFiles();
    expect(watchedPaths).toEqual([]);
  });

  it('should handle file deletion and update metadata for generated-deleted conflicts', async () => {
    // Set up initial metadata with generated-deleted conflicts
    const testPackagePath = path.join(outputDirectory, 'test-package');
    const initialMetadata: SyncMetadata = {
      status: 'in-progress',
      startedAt: new Date().toISOString(),
      packages: {
        'test-package': {
          name: 'test-package',
          path: testPackagePath,
          status: 'conflicts',
          result: {
            filesWithConflicts: [
              {
                relativePath: 'delete.txt',
                conflictType: 'generated-deleted',
              },
            ],
            completedAt: new Date().toISOString(),
          },
          order: 0,
        },
      },
    };

    // Mock the getMetadata method
    syncMetadataController.writeMetadata(initialMetadata);

    // Create the file to be deleted
    vol.fromJSON({
      [path.join(testPackagePath, 'delete.txt')]: 'content to delete',
    });

    // Start the monitor
    await monitor.start();

    // Simulate file change event without any changes
    emitMockFsWatcherEvent('change', path.join(testPackagePath, 'delete.txt'));
    // wait for event to propagate
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    // Verify metadata was not updated
    const noUpdateMetadata = await syncMetadataController.getMetadata();
    const noUpdatePackageInfo = noUpdateMetadata.packages['test-package'];
    expect(noUpdatePackageInfo.status).toBe('conflicts');
    expect(noUpdatePackageInfo.result?.filesWithConflicts).toHaveLength(1);

    // Simulate file deletion
    await vol.promises.unlink(path.join(testPackagePath, 'delete.txt'));

    // Simulate file unlink event
    emitMockFsWatcherEvent('unlink', path.join(testPackagePath, 'delete.txt'));

    // wait for event to propagate
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    // Verify metadata was updated
    const updatedMetadata = await syncMetadataController.getMetadata();
    expect(
      updatedMetadata.packages['test-package'].result?.filesWithConflicts,
    ).toHaveLength(0);
  });

  it('should stop monitoring when stop is called', async () => {
    // Start the monitor
    await monitor.start();

    // Stop the monitor
    await monitor.stop();

    // Verify watchers were closed
    const watchedPaths = getMockFsWatchedFiles();
    expect(watchedPaths).toHaveLength(0);
  });
});
