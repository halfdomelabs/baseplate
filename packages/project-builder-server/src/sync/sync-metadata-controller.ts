import type { Logger } from '@halfdomelabs/sync';

import { TypedEventEmitter } from '@halfdomelabs/utils';
import { watch } from 'chokidar';
import { isEqual, throttle } from 'es-toolkit';
import path from 'node:path';

import type { PackageSyncInfo, SyncMetadata } from './sync-metadata.js';

import {
  readSyncMetadata,
  SYNC_METADATA_PATH,
  writeSyncMetadata,
} from './sync-metadata-service.js';

/**
 * Controller for getting updates about the latest sync metadata.
 * Uses throttling to coalesce multiple write calls into a single save.
 */
export class SyncMetadataController extends TypedEventEmitter<{
  ['sync-metadata-changed']: SyncMetadata | undefined;
}> {
  protected syncMetadata: SyncMetadata | undefined;
  protected initialized = false;

  private readonly throttledWrite = throttle((metadata: SyncMetadata) => {
    this.emit('sync-metadata-changed', metadata);
    writeSyncMetadata(this.projectDirectory, metadata).catch((err: unknown) => {
      this.logger.error(`Failed to write metadata: ${String(err)}`);
    });
  }, 100);

  constructor(
    protected readonly projectDirectory: string,
    protected logger: Logger,
  ) {
    super();
  }

  watchMetadata(): () => void {
    const watcher = watch(
      path.join(this.projectDirectory, SYNC_METADATA_PATH),
      {
        awaitWriteFinish: true,
      },
    );

    const handleMetadataChange = (): void => {
      readSyncMetadata(this.projectDirectory)
        .then((metadata) => {
          if (!isEqual(metadata, this.syncMetadata)) {
            this.syncMetadata = metadata;
            this.emit('sync-metadata-changed', metadata);
          }
        })
        .catch((err: unknown) => {
          this.logger.error(
            `Failed to read sync metadata. Please either fix or delete the file to continue: ${String(err)}`,
          );
        });
    };

    watcher.on('add', handleMetadataChange);
    watcher.on('change', handleMetadataChange);
    watcher.on('unlink', handleMetadataChange);

    return () => {
      watcher.close().catch((err: unknown) => {
        this.logger.error(`Failed to close metadata watcher: ${String(err)}`);
      });
    };
  }

  async getMetadata(): Promise<SyncMetadata | undefined> {
    if (!this.initialized) {
      this.syncMetadata = await readSyncMetadata(this.projectDirectory).catch(
        (err: unknown) => {
          throw new Error(
            `Failed to read sync metadata. Please either fix or delete the file to continue: ${String(err)}`,
          );
        },
      );
      this.initialized = true;
    }

    return this.syncMetadata;
  }

  writeMetadata(syncMetadata: SyncMetadata): void {
    this.syncMetadata = syncMetadata;
    this.initialized = true;
    this.throttledWrite(syncMetadata);
  }

  updateMetadataForPackage(
    packageId: string,
    update: (metadata: PackageSyncInfo) => PackageSyncInfo,
  ): void {
    const metadata = this.syncMetadata;
    if (!metadata) throw new Error('No metadata found');
    if (!(packageId in metadata.packages)) {
      throw new Error(`No package metadata found for ${packageId}`);
    }

    const updatedMetadata: SyncMetadata = {
      ...metadata,
      packages: {
        ...metadata.packages,
        [packageId]: update(metadata.packages[packageId]),
      },
    };

    this.writeMetadata(updatedMetadata);
  }

  updateMetadata(update: (metadata: SyncMetadata) => SyncMetadata): void {
    const metadata = this.syncMetadata;
    if (!metadata) throw new Error('No metadata found');
    const updatedMetadata = update(metadata);
    this.writeMetadata(updatedMetadata);
  }
}
