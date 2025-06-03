import type { Logger } from '@baseplate-dev/sync';

import {
  enhanceErrorWithContext,
  TypedEventEmitter,
} from '@baseplate-dev/utils';
import { watch } from 'chokidar';
import { isEqual, throttle } from 'es-toolkit';
import path from 'node:path';

import type { PackageSyncInfo, SyncMetadata } from './sync-metadata.js';

import {
  readSyncMetadata,
  SYNC_METADATA_PATH,
  writeSyncMetadata,
} from './sync-metadata-service.js';
import { INITIAL_SYNC_METADATA } from './sync-metadata.js';

/**
 * Controller for getting updates about the latest sync metadata.
 * Uses throttling to coalesce multiple write calls into a single save.
 */
export class SyncMetadataController extends TypedEventEmitter<{
  ['sync-metadata-changed']: SyncMetadata;
}> {
  protected syncMetadata: SyncMetadata | undefined;

  private readonly throttledWrite: (metadata: SyncMetadata) => void;

  constructor(
    protected readonly projectDirectory: string,
    protected logger: Logger,
    protected options: { disableThrottling?: boolean } = {},
  ) {
    super();
    const writeCallback = (metadata: SyncMetadata): void => {
      // we emit the event before writing since we cache the metadata in memory
      this.emit('sync-metadata-changed', metadata);
      writeSyncMetadata(this.projectDirectory, metadata).catch(
        (err: unknown) => {
          this.logger.error(`Failed to write metadata: ${String(err)}`);
        },
      );
    };
    this.throttledWrite = options.disableThrottling
      ? writeCallback
      : throttle(writeCallback, 100);
  }

  private getMetadataPath(): string {
    return path.resolve(this.projectDirectory, SYNC_METADATA_PATH);
  }

  async readSyncMetadata(): Promise<SyncMetadata> {
    return readSyncMetadata(this.projectDirectory).catch((err: unknown) => {
      if (err instanceof TypeError) {
        this.logger.warn(
          `Invalid sync metadata found in ${this.getMetadataPath()}. Will use default metadata instead.`,
        );
        this.logger.warn(err.message);
        return structuredClone(INITIAL_SYNC_METADATA);
      }
      throw enhanceErrorWithContext(
        err,
        `Failed to read sync metadata from ${this.getMetadataPath()}`,
      );
    });
  }

  watchMetadata(): () => void {
    const watcher = watch(this.getMetadataPath(), { awaitWriteFinish: true });

    const handleMetadataChange = (): void => {
      this.readSyncMetadata()
        .then((metadata) => {
          if (!isEqual(metadata, this.syncMetadata)) {
            this.syncMetadata = metadata;
            this.emit('sync-metadata-changed', metadata);
          }
        })
        .catch((err: unknown) => {
          this.logger.error(`Failed to update sync metadata: ${String(err)}`);
        });
    };

    watcher.on('all', handleMetadataChange);

    return () => {
      watcher.close().catch((err: unknown) => {
        this.logger.error(`Failed to close metadata watcher: ${String(err)}`);
      });
    };
  }

  async getMetadata(): Promise<SyncMetadata> {
    this.syncMetadata ??= await this.readSyncMetadata();

    return this.syncMetadata;
  }

  writeMetadata(syncMetadata: SyncMetadata): void {
    this.syncMetadata = syncMetadata;
    this.throttledWrite(syncMetadata);
  }

  async updateMetadataForPackage(
    packageId: string,
    update: (metadata: PackageSyncInfo) => PackageSyncInfo,
  ): Promise<void> {
    const metadata = await this.getMetadata();
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

  async updateMetadata(
    update: (metadata: SyncMetadata) => SyncMetadata,
  ): Promise<void> {
    const metadata = await this.getMetadata();
    const updatedMetadata = update(metadata);
    this.writeMetadata(updatedMetadata);
  }
}
