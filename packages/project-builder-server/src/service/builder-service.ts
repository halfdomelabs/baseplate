import { getLatestMigrationVersion } from '@halfdomelabs/project-builder-lib';
import { createEventedLogger, EventedLogger } from '@halfdomelabs/sync';
import chalk from 'chalk';
import chokidar from 'chokidar';
import fs from 'fs-extra';
import path from 'path';

import { GeneratorEngineSetupConfig } from '@src/index.js';
import { buildProjectForDirectory } from '@src/runner/index.js';
import { expandPathWithTilde } from '@src/utils/path.js';
import { TypedEventEmitterBase } from '@src/utils/typed-event-emitter.js';

export interface FilePayload {
  contents: string;
  lastModifiedAt: string;
}

type WriteResult =
  | { type: 'success'; lastModifiedAt: string }
  | { type: 'modified-more-recently' };

function getLastModifiedTime(filePath: string): Promise<string> {
  return fs.stat(filePath).then((stat) => stat.mtime.toISOString());
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
  generatorSetupConfig: GeneratorEngineSetupConfig;
  cliVersion: string;
}

export class ProjectBuilderService extends TypedEventEmitterBase<{
  'project-json-changed': FilePayload | null;
  'command-console-emitted': CommandConsoleEmittedPayload;
}> {
  public readonly directory: string;

  private projectJsonPath: string;

  private watcher: chokidar.FSWatcher | undefined;

  public readonly id: string;

  private isRunningCommand = false;

  private logger: EventedLogger;

  private generatorSetupConfig: GeneratorEngineSetupConfig;

  private cliVersion: string;

  constructor({
    directory,
    id,
    generatorSetupConfig,
    cliVersion,
  }: ProjectBuilderServiceOptions) {
    super();

    this.directory = directory;
    this.projectJsonPath = expandPathWithTilde(
      path.join(directory, 'baseplate/project.json'),
    );
    this.id = id;
    this.generatorSetupConfig = generatorSetupConfig;
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
  }

  public async init(): Promise<void> {
    const fileExists = await fs.pathExists(this.projectJsonPath);
    if (!fileExists) {
      if (!fileExists) {
        // auto-create a simple project.json file
        this.logger.info(
          `project.json not found. Creating project.json file in ${this.projectJsonPath}`,
        );
        const starterName =
          getFirstNonBaseplateParentFolder(this.projectJsonPath) ?? 'project';
        await fs.writeJson(this.projectJsonPath, {
          name: starterName,
          cliVerison: this.cliVersion,
          schemaVersion: getLatestMigrationVersion(),
        });
      }
    }

    this.watcher = chokidar.watch(this.projectJsonPath, {
      ignoreInitial: true,
      awaitWriteFinish: true,
    });

    const handleChange = (): void => {
      this.readConfig()
        .then((payload) => {
          this.emit('project-json-changed', payload);
        })
        .catch((err) => this.logger.error(err));
    };

    this.watcher.on('add', handleChange);
    this.watcher.on('change', handleChange);
    this.watcher.on('unlink', handleChange);
  }

  public close(): void {
    if (this.watcher) {
      this.watcher
        .close()
        .catch((err) =>
          this.logger.error(err instanceof Error ? err.toString() : typeof err),
        );
    }
  }

  public async readConfig(): Promise<FilePayload | null> {
    if (!(await fs.pathExists(this.projectJsonPath))) {
      return null;
    }
    const [lastModifiedAt, contents] = await Promise.all([
      getLastModifiedTime(this.projectJsonPath),
      fs.promises.readFile(this.projectJsonPath, 'utf8'),
    ]);
    return { contents, lastModifiedAt };
  }

  public async writeConfig(payload: FilePayload): Promise<WriteResult> {
    if (await fs.pathExists(this.projectJsonPath)) {
      const lastModifiedAt = await getLastModifiedTime(this.projectJsonPath);
      if (lastModifiedAt !== payload.lastModifiedAt) {
        return { type: 'modified-more-recently' };
      }
    } else {
      await fs.ensureDir(path.dirname(this.projectJsonPath));
    }
    await fs.promises.writeFile(this.projectJsonPath, payload.contents, 'utf8');
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
        generatorSetupConfig: this.generatorSetupConfig,
      });
    } catch (err) {
      this.logger.error(err instanceof Error ? err.toString() : typeof err);
      this.emit('command-console-emitted', {
        id: this.id,
        message: chalk.red(
          `Error building project: ${
            err instanceof Error
              ? `${err.message}${err.stack ? `\n${err.stack}` : ''}`
              : 'Unknown error'
          }`,
        ),
      });
      throw err;
    } finally {
      this.isRunningCommand = false;
    }
  }
}
