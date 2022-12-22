import path from 'path';
import chokidar from 'chokidar';
import fs from 'fs-extra';
import { buildProjectForDirectory } from '@src/runner';
import { logger } from '@src/services/logger';
import { createEventedLogger, EventedLogger } from '@src/utils/evented-logger';
import { TypedEventEmitterBase } from '@src/utils/typed-event-emitter';

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

export class ProjectBuilderApi extends TypedEventEmitterBase<{
  'project-json-changed': FilePayload | null;
  'command-console-emitted': CommandConsoleEmittedPayload;
}> {
  public readonly directory: string;

  private projectJsonPath: string;

  private watcher: chokidar.FSWatcher | undefined;

  public readonly id: string;

  private isRunningCommand = false;

  private logger: EventedLogger;

  constructor(directory: string, id: string) {
    super();

    this.directory = directory;
    this.projectJsonPath = path.join(directory, 'baseplate/project.json');
    this.id = id;

    this.logger = createEventedLogger();
    this.logger.onLog((message) => {
      this.emit('command-console-emitted', {
        id: this.id,
        message,
      });
    });
  }

  public async init(): Promise<void> {
    const fileExists = await fs.pathExists(this.projectJsonPath);
    if (!fileExists) {
      throw new Error(
        `Could not find project.json file at ${this.projectJsonPath}`
      );
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
        .catch((err) => logger.error(err));
    };

    this.watcher.on('add', handleChange);
    this.watcher.on('change', handleChange);
    this.watcher.on('unlink', handleChange);
  }

  public close(): void {
    if (this.watcher) {
      this.watcher.close().catch((err) => logger.error(err));
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
    const lastModifiedAt = await getLastModifiedTime(this.projectJsonPath);
    if (lastModifiedAt !== payload.lastModifiedAt) {
      return { type: 'modified-more-recently' };
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

      await buildProjectForDirectory(this.directory, {}, this.logger);
    } finally {
      this.isRunningCommand = false;
    }
  }
}
