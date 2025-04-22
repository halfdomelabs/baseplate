import type { Logger } from '@halfdomelabs/sync';

import { TypedEventEmitter } from '@halfdomelabs/utils';
import { throttle } from 'es-toolkit';

import type { PackageSyncInfo, SyncMetadata } from './sync-metadata.js';

import {
  readSyncMetadata,
  writeSyncMetadata,
} from './sync-metadata-service.js';

/**
 * Controller for getting updates about the latest sync metadata.
 * Uses throttling to coalesce multiple write calls into a single save.
 */
export class SyncMetadataController extends TypedEventEmitter<{
  ['sync-metadata-changed']: SyncMetadata;
}> {
  protected syncMetadata: SyncMetadata | undefined;
  protected initialized = false;

  private readonly throttledWrite = throttle((metadata: SyncMetadata) => {
    writeSyncMetadata(this.projectDirectory, metadata).catch((err: unknown) => {
      this.logger.error(`Failed to write metadata: ${String(err)}`);
    });
  }, 50);

  constructor(
    protected readonly projectDirectory: string,
    protected logger: Logger,
  ) {
    super();
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
    this.emit('sync-metadata-changed', syncMetadata);
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
