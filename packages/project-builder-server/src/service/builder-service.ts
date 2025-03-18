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
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  createNodeSchemaParserContext,
  discoverPlugins,
} from '@src/plugins/index.js';
import { buildProjectForDirectory } from '@src/runner/index.js';

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
  message: string;
}

interface ProjectBuilderServiceOptions {
  directory: string;
  id: string;
  builtInPlugins: PluginMetadataWithPaths[];
  cliVersion: string;
}

interface ProjectBuilderServiceEvents {
  'project-json-changed': ProjectDefinitionFilePayload;
  'command-console-emitted': CommandConsoleEmittedPayload;
}

export class ProjectBuilderService extends TypedEventEmitter<ProjectBuilderServiceEvents> {
  public readonly directory: string;

  private projectJsonPath: string;

  private watcher: FSWatcher | undefined;

  public readonly id: string;

  private isRunningCommand = false;

  private logger: EventedLogger;

  private cliVersion: string;

  private cachedAvailablePlugins: PluginMetadataWithPaths[] | null = null;

  private builtInPlugins: PluginMetadataWithPaths[];

  private schemaParserContext: SchemaParserContext | undefined;

  constructor({
    directory,
    id,
    cliVersion,
    builtInPlugins,
  }: ProjectBuilderServiceOptions) {
    super();

    this.directory = directory;
    this.projectJsonPath = path.join(
      directory,
      'baseplate/project-definition.json',
    );
    this.id = id;
    this.cliVersion = cliVersion;

    this.logger = createEventedLogger();
    this.logger.onLog((message) => {
      this.emit('command-console-emitted', {
        id: this.id,
        message,
      });
    });
    this.logger.onError((message) => {
      this.emit('command-console-emitted', {
        id: this.id,
        message,
      });
    });
    this.builtInPlugins = builtInPlugins;
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
      cliVersion: this.cliVersion,
      portOffset: 5000,
      schemaVersion: getLatestMigrationVersion(),
    } satisfies ProjectDefinitionInput);
  }

  public init(): void {
    this.watcher = chokidar.watch(this.projectJsonPath, {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
      },
    });

    const boundHandleProjectJsonChange =
      this.handleProjectJsonChange.bind(this);
    this.watcher.on('add', boundHandleProjectJsonChange);
    this.watcher.on('change', boundHandleProjectJsonChange);
    this.watcher.on('unlink', boundHandleProjectJsonChange);
  }

  public close(): void {
    if (this.watcher) {
      this.watcher.close().catch((err: unknown) => {
        this.logger.error(err);
      });
    }
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

  public async buildProject(): Promise<void> {
    try {
      if (this.isRunningCommand) {
        throw new Error('Another command is already running');
      }
      this.isRunningCommand = true;

      await buildProjectForDirectory({
        directory: this.directory,
        logger: this.logger,
        context: await this.getSchemaParserContext(),
      });
    } catch (error) {
      this.logger.error(
        error instanceof Error ? error.toString() : typeof error,
      );
      this.emit('command-console-emitted', {
        id: this.id,
        message: chalk.red(
          `Error building project: ${
            error instanceof Error
              ? `${error.message}${error.stack ? `\n${error.stack}` : ''}`
              : 'Unknown error'
          }`,
        ),
      });
      throw error;
    } finally {
      this.isRunningCommand = false;
    }
  }

  public async getSchemaParserContext(): Promise<SchemaParserContext> {
    if (!this.schemaParserContext) {
      this.schemaParserContext = await createNodeSchemaParserContext(
        this.directory,
        this.logger,
        this.builtInPlugins,
      );
    }
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
}
