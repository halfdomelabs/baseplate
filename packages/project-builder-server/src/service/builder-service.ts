import type {
  PluginMetadataWithPaths,
  ProjectDefinitionInput,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';
import type { EventedLogger } from '@halfdomelabs/sync';
import type { FSWatcher } from 'chokidar';

import { getLatestMigrationVersion } from '@halfdomelabs/project-builder-lib';
import { createEventedLogger } from '@halfdomelabs/sync';
import { TypedEventEmitter } from '@halfdomelabs/utils';
import { ensureDir, fileExists } from '@halfdomelabs/utils/node';
import chalk from 'chalk';
import chokidar from 'chokidar';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  createNodeSchemaParserContext,
  discoverPlugins,
} from '@src/plugins/index.js';
import { buildProjectForDirectory } from '@src/runner/index.js';

/**
 * The payload of a project definition file with a last modified timestamp.
 */
export interface FilePayload {
  contents: string;
  lastModifiedAt: string;
}

/**
 * The result of a write operation on a project definition file.
 */
export type WriteResult =
  | { type: 'success'; lastModifiedAt: string }
  | { type: 'modified-more-recently' };

function getLastModifiedTime(filePath: string): Promise<string> {
  return stat(filePath).then((stat) => stat.mtime.toISOString());
}

export interface CommandConsoleEmittedPayload {
  id: string;
  message: string;
}

function getFirstNonBaseplateParentFolder(filePath: string): string | null {
  const segments = path.dirname(filePath).split(path.sep);

  for (let i = segments.length - 1; i >= 0; i -= 1) {
    if (segments[i] !== 'baseplate') {
      return segments[i];
    }
  }

  return null;
}

interface ProjectBuilderServiceOptions {
  directory: string;
  id: string;
  builtInPlugins: PluginMetadataWithPaths[];
  cliVersion: string;
}

interface ProjectBuilderServiceEvents {
  'project-json-changed': FilePayload | undefined;
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
    this.readConfig()
      .then((payload) => {
        this.emit('project-json-changed', payload);
      })
      .catch((error: unknown) => {
        this.logger.error(error);
      });
  }

  public async init(): Promise<void> {
    const projectJsonExists = await fileExists(this.projectJsonPath);

    if (!projectJsonExists) {
      // auto-create a simple project-definition.json file
      this.logger.info(
        `project-definition.json not found. Creating project-definition.json file in ${this.projectJsonPath}`,
      );
      const starterName =
        getFirstNonBaseplateParentFolder(this.projectJsonPath) ?? 'project';
      await writeFile(
        this.projectJsonPath,
        JSON.stringify({
          name: starterName,
          cliVersion: this.cliVersion,
          portOffset: 5000,
          schemaVersion: getLatestMigrationVersion(),
        } satisfies ProjectDefinitionInput),
      );
    }

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
        this.logger.error(err instanceof Error ? err.toString() : typeof err);
      });
    }
  }

  public async readConfig(): Promise<FilePayload | undefined> {
    if (!(await fileExists(this.projectJsonPath))) {
      return undefined;
    }
    const [lastModifiedAt, contents] = await Promise.all([
      getLastModifiedTime(this.projectJsonPath),
      readFile(this.projectJsonPath, 'utf8'),
    ]);
    return { contents, lastModifiedAt };
  }

  public async writeConfig(payload: FilePayload): Promise<WriteResult> {
    if (await fileExists(this.projectJsonPath)) {
      const lastModifiedAt = await getLastModifiedTime(this.projectJsonPath);
      if (lastModifiedAt !== payload.lastModifiedAt) {
        return { type: 'modified-more-recently' };
      }
    } else {
      await ensureDir(path.dirname(this.projectJsonPath));
    }
    await writeFile(this.projectJsonPath, payload.contents, 'utf8');
    const newLastModifiedAt = await getLastModifiedTime(this.projectJsonPath);
    return { type: 'success', lastModifiedAt: newLastModifiedAt };
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
