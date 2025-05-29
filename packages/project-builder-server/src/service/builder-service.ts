import type {
  PluginMetadataWithPaths,
  ProjectDefinitionInput,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';
import type { EventedLogger } from '@halfdomelabs/sync';
import type { FSWatcher } from 'chokidar';

import { getLatestMigrationVersion } from '@halfdomelabs/project-builder-lib';
import { createEventedLogger } from '@halfdomelabs/sync';
import { hashWithSHA256, TypedEventEmitter } from '@halfdomelabs/utils';
import {
  ensureDir,
  fileExists,
  handleFileNotFoundError,
} from '@halfdomelabs/utils/node';
import chalk from 'chalk';
import chokidar from 'chokidar';
import { execa, parseCommandString } from 'execa';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { PackageSyncInfo, SyncMetadata } from '#src/sync/index.js';

import {
  createNodeSchemaParserContext,
  discoverPlugins,
} from '#src/plugins/index.js';
import { ConflictFileMonitor } from '#src/sync/conflict-file-monitor.js';
import { buildProject } from '#src/sync/index.js';
import { SyncMetadataController } from '#src/sync/sync-metadata-controller.js';
import { getPackageSyncStatusFromResult } from '#src/sync/utils.js';

import type { BaseplateUserConfig } from '../user-config/user-config-schema.js';

/**
 * The payload of a project definition file read operation.
 */
export interface ProjectDefinitionFilePayload {
  /**
   * The contents of the project definition file.
   */
  contents: string;
  /**
   * The SHA-256 hash of the contents of the project definition file.
   */
  hash: string;
}

/**
 * The result of a write operation on a project definition file.
 */
export type ProjectDefinitionFileWriteResult =
  // The file was written successfully.
  | { type: 'success' }
  // The file was not written because the original contents do not match the
  // expected contents and the file should be re-read.
  | {
      type: 'original-contents-mismatch';
      currentPayload: ProjectDefinitionFilePayload;
    };

/**
 * The payload of a command console emitted event.
 */
export interface CommandConsoleEmittedPayload {
  id: string;
  /**
   * The message to display in the console.
   */
  message: string;
}

interface ProjectBuilderServiceOptions {
  directory: string;
  id: string;
  builtInPlugins: PluginMetadataWithPaths[];
  cliVersion: string;
  userConfig: BaseplateUserConfig;
  skipCommands?: boolean;
}

export interface SyncMetadataChangedPayload {
  id: string;
  syncMetadata: SyncMetadata;
}

export interface SyncStartedPayload {
  id: string;
}

export interface SyncCompletedPayload {
  id: string;
  syncMetadata: SyncMetadata;
}

const MAX_CONSOLE_OUTPUT_LENGTH = 1000;

interface ProjectBuilderServiceEvents {
  'project-json-changed': ProjectDefinitionFilePayload;
  'command-console-emitted': CommandConsoleEmittedPayload;
  'sync-metadata-changed': SyncMetadataChangedPayload;
  'sync-started': SyncStartedPayload;
  'sync-completed': SyncCompletedPayload;
}

export class ProjectBuilderService extends TypedEventEmitter<ProjectBuilderServiceEvents> {
  public readonly directory: string;

  private projectJsonPath: string;

  private watcher: FSWatcher | undefined;

  public readonly id: string;

  private abortController: AbortController | undefined;

  private logger: EventedLogger;

  private cliVersion: string;

  private cachedAvailablePlugins: PluginMetadataWithPaths[] | null = null;

  private builtInPlugins: PluginMetadataWithPaths[];

  private schemaParserContext: SchemaParserContext | undefined;

  private userConfig: BaseplateUserConfig;

  private syncMetadataController: SyncMetadataController;

  private unsubscribeOperations: (() => void)[] = [];

  private currentSyncConsoleOutput: string[] = [];

  private conflictFileMonitor: ConflictFileMonitor | undefined;

  private skipCommands: boolean;

  constructor({
    directory,
    id,
    cliVersion,
    builtInPlugins,
    userConfig,
    skipCommands,
  }: ProjectBuilderServiceOptions) {
    super();

    this.directory = directory;
    this.projectJsonPath = path.join(
      directory,
      'baseplate/project-definition.json',
    );
    this.id = id;
    this.cliVersion = cliVersion;
    this.userConfig = userConfig;
    this.logger = createEventedLogger();
    this.builtInPlugins = builtInPlugins;
    this.syncMetadataController = new SyncMetadataController(
      this.directory,
      this.logger,
    );
    this.skipCommands = skipCommands ?? false;
    this.syncMetadataController
      .getMetadata()
      .then((syncMetadata) => {
        // if the sync is in progress, cancel it - it's more likely
        // the previous sync crashed then we have two simultaneous syncs
        // happening.
        if (syncMetadata.status === 'in-progress') {
          this.syncMetadataController.writeMetadata({
            ...syncMetadata,
            status: 'cancelled',
          });
        }
      })
      .catch((err: unknown) => {
        this.logger.error(`Unable to get sync metadata: ${String(err)}`);
      });
    const emitConsoleEvent = (message: string): void => {
      if (this.currentSyncConsoleOutput.length > MAX_CONSOLE_OUTPUT_LENGTH) {
        this.currentSyncConsoleOutput.shift();
      }
      this.currentSyncConsoleOutput.push(message);
      this.emit('command-console-emitted', {
        id: this.id,
        message,
      });
    };
    this.conflictFileMonitor = new ConflictFileMonitor(
      this.syncMetadataController,
      this.logger,
    );
    this.conflictFileMonitor.start().catch((err: unknown) => {
      this.logger.error(
        `Unable to start conflict file monitor: ${String(err)}`,
      );
    });
    this.unsubscribeOperations.push(
      () => {
        this.conflictFileMonitor?.stop().catch((err: unknown) => {
          this.logger.error(
            `Unable to stop conflict file monitor: ${String(err)}`,
          );
        });
      },
      this.logger.onLog(emitConsoleEvent),
      this.logger.onError(emitConsoleEvent),
      this.syncMetadataController.watchMetadata(),
      this.syncMetadataController.on(
        'sync-metadata-changed',
        (syncMetadata) => {
          this.emit('sync-metadata-changed', {
            id: this.id,
            syncMetadata,
          });
        },
      ),
    );
  }

  protected handleProjectJsonChange(): void {
    this.readDefinition()
      .then((payload) => {
        this.emit('project-json-changed', payload);
      })
      .catch((error: unknown) => {
        this.logger.error(error);
      });
  }

  protected _getInitialProjectDefinition(): string {
    const starterName = path
      .basename(path.dirname(path.dirname(this.projectJsonPath)))
      .toLowerCase();
    const sanitizedName = starterName.replaceAll(/[^a-zA-Z0-9-]/g, '');
    const finalName = sanitizedName || 'project-name';
    return JSON.stringify({
      name: finalName,
      version: '0.1.0',
      cliVersion: this.cliVersion,
      portOffset: 5000,
      schemaVersion: getLatestMigrationVersion(),
    } satisfies ProjectDefinitionInput);
  }

  /**
   * Initializes the project builder service.
   */
  public init(): void {
    this.watcher = chokidar.watch(this.projectJsonPath, {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
      },
    });

    const boundHandleProjectJsonChange =
      this.handleProjectJsonChange.bind(this);
    this.watcher.on('all', boundHandleProjectJsonChange);
  }

  /**
   * Closes the project builder service.
   */
  public close(): void {
    if (this.watcher) {
      this.watcher.close().catch((err: unknown) => {
        this.logger.error(err);
      });
    }
    for (const unsubscribe of this.unsubscribeOperations) unsubscribe();
    this.abortEventEmitter();
  }

  /**
   * Returns the sync metadata.
   *
   * @returns The sync metadata.
   */
  public async getSyncMetadata(): Promise<SyncMetadata> {
    return this.syncMetadataController.getMetadata();
  }

  /**
   * Reads the project definition file.
   *
   * @returns The contents of the project definition file.
   */
  public async readDefinition(): Promise<ProjectDefinitionFilePayload> {
    const fileReadResult = await readFile(this.projectJsonPath, 'utf8').catch(
      handleFileNotFoundError,
    );
    const contents = fileReadResult ?? this._getInitialProjectDefinition();
    return {
      contents,
      hash: await hashWithSHA256(contents),
    };
  }

  /**
   * Writes a project definition file checking that the original contents match
   * the current contents of the file to avoid overwriting changes made by the
   * user.
   *
   * @param newContents - The new contents of the project definition file.
   * @param oldContentsHash - The SHA-256 hash of the old contents of the project definition file.
   * @returns The result of the write operation.
   */
  public async writeDefinition(
    newContents: string,
    oldContentsHash: string,
  ): Promise<ProjectDefinitionFileWriteResult> {
    if (await fileExists(this.projectJsonPath)) {
      const currentContents = await readFile(this.projectJsonPath);
      const currentContentsHash = await hashWithSHA256(currentContents);
      if (currentContentsHash !== oldContentsHash) {
        return {
          type: 'original-contents-mismatch',
          currentPayload: {
            contents: currentContents.toString('utf8'),
            hash: currentContentsHash,
          },
        };
      }
    } else {
      await ensureDir(path.dirname(this.projectJsonPath));
    }
    await writeFile(this.projectJsonPath, newContents, 'utf8');
    return { type: 'success' };
  }

  /**
   * Initiates a new build operation.
   */
  public async buildProject(): Promise<void> {
    try {
      if (this.abortController) {
        throw new Error('Build process is already running');
      }
      const syncMetadata = await this.getSyncMetadata();
      if (
        Object.values(syncMetadata.packages).some(
          (p) => p.status === 'conflicts',
        )
      ) {
        throw new Error('Conflicts must be resolved before building');
      }
      this.abortController = new AbortController();
      this.currentSyncConsoleOutput = [];
      this.emit('sync-started', { id: this.id });

      await buildProject({
        directory: this.directory,
        logger: this.logger,
        context: await this.getSchemaParserContext(),
        userConfig: this.userConfig,
        syncMetadataController: this.syncMetadataController,
        abortSignal: this.abortController.signal,
        skipCommands: this.skipCommands,
      });
    } catch (error) {
      this.logger.error(
        chalk.red(
          `Error building project: ${
            error instanceof Error ? error.stack : String(error)
          }`,
        ),
      );
      throw error;
    } finally {
      this.abortController = undefined;
      this.emit('sync-completed', {
        id: this.id,
        syncMetadata: await this.getSyncMetadata().catch((err: unknown) => ({
          status: 'error',
          completedAt: new Date().toISOString(),
          globalErrors: [String(err)],
          packages: {},
        })),
      });
    }
  }

  /**
   * Cancels the current sync operation.
   */
  public cancelSync(): void {
    this.abortController?.abort();
  }

  /**
   * Returns the console output from the current sync operation.
   *
   * @returns The console output from the current sync operation.
   */
  public getCurrentSyncConsoleOutput(): string[] {
    return this.currentSyncConsoleOutput;
  }

  public async getSchemaParserContext(): Promise<SchemaParserContext> {
    this.schemaParserContext ??= await createNodeSchemaParserContext(
      this.directory,
      this.logger,
      this.builtInPlugins,
    );
    return this.schemaParserContext;
  }

  public async getAvailablePlugins(): Promise<PluginMetadataWithPaths[]> {
    if (!this.cachedAvailablePlugins) {
      const projectPlugins = await discoverPlugins(this.directory, this.logger);
      this.cachedAvailablePlugins = [
        ...this.builtInPlugins.filter(
          (plugin) =>
            !projectPlugins.some(
              (projectPlugin) =>
                projectPlugin.packageName === plugin.packageName,
            ),
        ),
        ...projectPlugins,
      ];
    }
    return this.cachedAvailablePlugins;
  }

  private async getPackageInfo(packageId: string): Promise<PackageSyncInfo> {
    const metadata = await this.syncMetadataController.getMetadata();
    if (!(packageId in metadata.packages)) {
      throw new Error(`Package ${packageId} not found`);
    }
    return metadata.packages[packageId];
  }

  /**
   * Opens the editor for a file.
   *
   * @param packageId - The ID of the package.
   * @param relativePath - The relative path of the file.
   */
  public async openEditor(
    packageId: string,
    relativePath: string,
  ): Promise<void> {
    const editor = this.userConfig.sync?.editor;
    if (!editor) {
      throw new Error('No editor configured');
    }
    const packageInfo = await this.getPackageInfo(packageId);
    const absolutePath = path.join(packageInfo.path, relativePath);
    const [command, ...args] = parseCommandString(editor);
    const result = execa(command, [...args, absolutePath], {
      cwd: this.directory,
      detached: true,
    });
    result.unref();
  }

  private async removeConflictFile(
    packageId: string,
    relativePath: string,
  ): Promise<void> {
    await this.syncMetadataController.updateMetadataForPackage(
      packageId,
      (packageInfo) => {
        const updatedPackageInfo = {
          ...packageInfo,
          result: packageInfo.result
            ? {
                ...packageInfo.result,
                filesWithConflicts:
                  packageInfo.result.filesWithConflicts?.filter(
                    (file) => file.relativePath !== relativePath,
                  ),
              }
            : undefined,
        };
        updatedPackageInfo.status = getPackageSyncStatusFromResult(
          updatedPackageInfo.result,
        );
        return updatedPackageInfo;
      },
    );
  }

  /**
   * Deletes a conflict file.
   *
   * @param packageId - The ID of the package.
   * @param relativePath - The relative path of the file.
   */
  public async deleteConflictFile(
    packageId: string,
    relativePath: string,
  ): Promise<void> {
    const packageInfo = await this.getPackageInfo(packageId);

    // check if file exists as a conflict file
    const conflictFile = packageInfo.result?.filesWithConflicts?.find(
      (file) => file.relativePath === relativePath,
    );
    if (!conflictFile) {
      throw new Error(
        `File ${relativePath} could not be found with any conflicts`,
      );
    }

    if (
      !['generated-deleted', 'working-deleted'].includes(
        conflictFile.conflictType,
      )
    ) {
      throw new Error(
        `File ${relativePath} is a ${conflictFile.conflictType} and cannot be deleted`,
      );
    }

    const absolutePath = path.join(
      packageInfo.path,
      conflictFile.generatedConflictRelativePath ?? conflictFile.relativePath,
    );
    await unlink(absolutePath).catch(handleFileNotFoundError);

    await this.removeConflictFile(packageId, relativePath);
  }

  /**
   * Keeps a conflict file.
   *
   * @param packageId - The ID of the package.
   * @param relativePath - The relative path of the file.
   */
  public async keepConflictFile(
    packageId: string,
    relativePath: string,
  ): Promise<void> {
    const packageInfo = await this.getPackageInfo(packageId);
    // check if file exists as a conflict file
    const conflictFile = packageInfo.result?.filesWithConflicts?.find(
      (file) => file.relativePath === relativePath,
    );
    if (!conflictFile) {
      throw new Error(
        `File ${relativePath} could not be found with any conflicts`,
      );
    }

    if (
      !['generated-deleted', 'working-deleted'].includes(
        conflictFile.conflictType,
      )
    ) {
      throw new Error(
        `File ${relativePath} is a ${conflictFile.conflictType} and cannot be kept`,
      );
    }

    await this.removeConflictFile(packageId, relativePath);
  }
}
