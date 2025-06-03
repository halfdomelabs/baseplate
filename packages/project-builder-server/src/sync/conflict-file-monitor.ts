import type { Logger } from '@baseplate-dev/sync';
import type { ChokidarOptions } from 'chokidar';

import { differenceSet } from '@baseplate-dev/utils';
import { fileExists, handleFileNotFoundError } from '@baseplate-dev/utils/node';
import { watch } from 'chokidar';
import { produce } from 'immer';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { SyncMetadataController } from './sync-metadata-controller.js';
import type { SyncMetadata } from './sync-metadata.js';

import { getPackageSyncStatusFromResult } from './utils.js';

const FS_WATCHER_OPTIONS: ChokidarOptions = {
  awaitWriteFinish: {
    stabilityThreshold: 1000,
  },
  ignoreInitial: true,
  // we use polling since fs events has some glitchiness with regards to deleting
  // the parent directory of a file that is being deleted
  usePolling: true,
  interval: 500,
};

/**
 * This class is responsible for monitoring the conflict files and the files that are pending deletion.
 *
 * It will update the metadata when the files are resolved.
 */
export class ConflictFileMonitor {
  // Start with an empty watched‑set; paths are added via `handleMetadataChange`
  private conflictFileWatcher = watch([], FS_WATCHER_OPTIONS);
  private conflictFiles = new Set<string>();
  private unsubscribers: (() => void)[] = [];

  constructor(
    private syncMetadataController: SyncMetadataController,
    private logger: Logger,
  ) {}

  private handleMetadataChange(metadata: SyncMetadata): void {
    const newConflictFiles = new Set<string>();
    for (const packageInfo of Object.values(metadata.packages)) {
      const { result } = packageInfo;
      if (!result) continue;

      for (const f of result.filesWithConflicts ?? []) {
        newConflictFiles.add(
          path.join(
            packageInfo.path,
            f.generatedConflictRelativePath ?? f.relativePath,
          ),
        );
      }
    }
    const conflictFilesToWatch = differenceSet(
      newConflictFiles,
      this.conflictFiles,
    );
    this.conflictFileWatcher.add([...conflictFilesToWatch]);
    // trigger the change event for each file on first load since
    // chokidar won't trigger the event for files that do not exist
    for (const filePath of conflictFilesToWatch) {
      this.handleFileChange(filePath).catch((err: unknown) => {
        this.logger.error(
          `Error handling conflict file change: ${String(err)}`,
        );
      });
    }

    const conflictFilesToUnwatch = differenceSet(
      this.conflictFiles,
      newConflictFiles,
    );
    this.conflictFileWatcher.unwatch([...conflictFilesToUnwatch]);
    this.conflictFiles = newConflictFiles;
  }

  private async checkFileForConflicts(filePath: string): Promise<boolean> {
    try {
      if (filePath.endsWith('.conflict')) return false;
      const contents = await readFile(filePath, 'utf8').catch(
        handleFileNotFoundError,
      );
      return !contents?.includes('>>>>>>>');
    } catch (err) {
      this.logger.error(`Error reading file ${filePath}: ${String(err)}`);
      return false;
    }
  }

  private async handleFileChange(filePath: string): Promise<void> {
    const doesFileExist = await fileExists(filePath);
    const isResolved =
      !doesFileExist || (await this.checkFileForConflicts(filePath));

    if (isResolved) {
      await this.syncMetadataController.updateMetadata(
        produce((draft) => {
          for (const packageInfo of Object.values(draft.packages)) {
            const relativePath = path.relative(packageInfo.path, filePath);
            const filesWithConflicts =
              packageInfo.result?.filesWithConflicts ?? [];
            // strip the file from the list of conflicts
            for (let i = filesWithConflicts.length - 1; i >= 0; i--) {
              const conflictFile = filesWithConflicts[i];
              // if the file is a generated-deleted or working-deleted conflict and it exists, consider it still unresolved
              if (
                (conflictFile.conflictType === 'generated-deleted' ||
                  conflictFile.conflictType === 'working-deleted') &&
                doesFileExist
              ) {
                continue;
              }
              if (
                conflictFile.generatedConflictRelativePath === relativePath ||
                conflictFile.relativePath === relativePath
              ) {
                filesWithConflicts.splice(i, 1);
              }
            }
            packageInfo.status = getPackageSyncStatusFromResult(
              packageInfo.result,
            );
          }
        }),
      );
    }
  }

  /**
   * This method will start the monitor and watch for changes in the metadata.
   */
  public async start(): Promise<void> {
    const handleConflictFileChange = (
      event: string,
      filePath: string,
    ): void => {
      this.handleFileChange(filePath).catch((err: unknown) => {
        this.logger.error(
          `Error handling conflict file change: ${String(err)}`,
        );
      });
    };

    this.conflictFileWatcher.on('all', handleConflictFileChange);

    try {
      const metadata = await this.syncMetadataController.getMetadata();
      this.handleMetadataChange(metadata);
    } catch (err) {
      this.logger.error(
        `Error getting initial metadata for conflict file monitor: ${String(err)}`,
      );
    }

    this.unsubscribers.push(
      this.syncMetadataController.on(
        'sync-metadata-changed',
        this.handleMetadataChange.bind(this),
      ),
    );
  }

  /**
   * This method will stop the monitor and close the watchers.
   */
  public async stop(): Promise<void> {
    for (const unsubscriber of this.unsubscribers) {
      unsubscriber();
    }
    await this.conflictFileWatcher.close();
  }
}
