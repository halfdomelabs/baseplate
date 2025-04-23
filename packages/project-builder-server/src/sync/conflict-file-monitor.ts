import type { Logger } from '@halfdomelabs/sync';
import type { ChokidarOptions } from 'chokidar';

import { differenceSet } from '@halfdomelabs/utils';
import { fileExists, handleFileNotFoundError } from '@halfdomelabs/utils/node';
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

  private handleMetadataChange(metadata: SyncMetadata | undefined): void {
    if (!metadata) return;

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
    const metadata = await this.syncMetadataController.getMetadata();
    if (!metadata) return;

    const doesFileExist = await fileExists(filePath);
    const isResolved =
      !doesFileExist || (await this.checkFileForConflicts(filePath));

    if (isResolved) {
      this.syncMetadataController.updateMetadata(
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
    const handleConflictFileChange = (filePath: string): void => {
      this.handleFileChange(filePath).catch((err: unknown) => {
        this.logger.error(
          `Error handling conflict file change: ${String(err)}`,
        );
      });
    };

    this.conflictFileWatcher.on('add', handleConflictFileChange);
    this.conflictFileWatcher.on('change', handleConflictFileChange);
    this.conflictFileWatcher.on('unlink', handleConflictFileChange);

    try {
      const metadata = await this.syncMetadataController.getMetadata();
      if (metadata) {
        this.handleMetadataChange(metadata);
      }
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
