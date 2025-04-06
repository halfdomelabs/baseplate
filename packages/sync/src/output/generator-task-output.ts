import { promises as fs } from 'node:fs';
import path from 'node:path';

import type {
  GeneratorInfo,
  GeneratorTask,
  GeneratorTaskEntry,
} from '@src/generators/index.js';

import type { BuilderAction } from './builder-action.js';
import type { GeneratorOutputFormatter } from './formatter.js';
import type {
  PostWriteCommand,
  PostWriteCommandOptions,
} from './post-write-commands/types.js';
import type { StringMergeAlgorithm } from './string-merge-algorithms/types.js';

/**
 * Options for writing a file
 */
export interface WriteFileOptions {
  /**
   * Alternate full IDs for the file (used if migrating file from one generator to another)
   * Note: This must be the full ID of the file (i.e. `<package>/<generator-name>/<file-id>`)
   */
  alternateFullIds?: string[];
  /**
   * Whether to format the file using the default formatter
   */
  shouldFormat?: boolean;
  /**
   * Never overwrite the file (e.g. for placeholder images)
   */
  shouldNeverOverwrite?: boolean;
  /**
   * Merge algorithms to use for the file
   */
  mergeAlgorithms?: StringMergeAlgorithm[];
}

/**
 * Data for a file to be written
 */
export interface FileData {
  /**
   * A unique identifier for the file within that generator (used to track renaming/moving of the file)
   */
  id: string;
  /**
   * The contents of the file
   */
  contents: string | Buffer;
  /**
   * The options for how to write the file
   */
  options?: WriteFileOptions;
}

/**
 * The output of a generator task
 */
export interface GeneratorTaskOutput {
  /**
   * A map of file paths to the file data
   */
  files: Map<string, FileData>;
  /**
   * The commands to run after the files are written
   */
  postWriteCommands: PostWriteCommand[];
  /**
   * The formatters that will be applied to all files depending on their extension
   */
  globalFormatters: GeneratorOutputFormatter[];
}

export interface GeneratorOutputMetadata {
  generatorTaskEntries: {
    id: string;
    generatorName: string;
    taskName: string;
    instanceName?: string;
  }[];
  generatorProviderRelationships: {
    providerTaskId: string;
    consumerTaskId: string;
    providerName: string;
    isOutput: boolean;
    isReadOnly: boolean;
  }[];
}

/**
 * The output of a generator task that includes metadata about the generator steps
 */
export interface GeneratorOutput extends GeneratorTaskOutput {
  metadata?: GeneratorOutputMetadata;
}

interface GeneratorTaskOutputBuilderContext {
  /**
   * The info of the current generator
   */
  generatorInfo: GeneratorInfo;
  /**
   * The id of the current generator
   */
  generatorId: string;
}

/**
 * Builder for the output of a generator task that collects the files and
 * commands that need to be run
 */
export class GeneratorTaskOutputBuilder {
  /**
   * The output of the generator
   */
  output: GeneratorTaskOutput;

  /**
   * The info of the current generator
   */
  generatorInfo: GeneratorInfo;

  /**
   * The id of the current generator
   */
  generatorId: string;

  /**
   * The dynamic tasks that have been added to the output
   */
  dynamicTasks: GeneratorTaskEntry[] = [];

  constructor(context: GeneratorTaskOutputBuilderContext) {
    this.output = {
      files: new Map(),
      postWriteCommands: [],
      globalFormatters: [],
    };
    this.generatorInfo = context.generatorInfo;
    this.generatorId = context.generatorId;
  }

  /**
   * Reads a template file from the generator base directory
   *
   * @param templatePath The path to the template file relative to the templates directory
   * @returns The contents of the template file
   */
  readTemplate(templatePath: string): Promise<string> {
    const fullPath = path.join(
      this.generatorInfo.baseDirectory,
      'templates',
      templatePath,
    );
    return fs.readFile(fullPath, 'utf8');
  }

  /**
   * Writes a file to the output
   *
   * @param payload The payload for the file to write
   */
  writeFile({
    id,
    filePath,
    contents,
    options,
    generatorName,
  }: {
    id: string;
    generatorName?: string;
    filePath: string;
    contents: string | Buffer;
    options?: WriteFileOptions;
  }): void {
    // normalize all paths to POSIX style / paths
    const fullPath = filePath.replaceAll(path.sep, path.posix.sep);

    if (this.output.files.has(fullPath)) {
      throw new Error(`Cannot overwrite file ${fullPath}`);
    }

    if (contents instanceof Buffer && options?.shouldFormat) {
      throw new Error(`Cannot format Buffer contents for ${fullPath}`);
    }

    this.output.files.set(fullPath, {
      id: `${generatorName ?? this.generatorInfo.name}:${id}`,
      contents,
      options,
    });
  }

  /**
   * Adds a post write command to the output
   *
   * @param command The command to run
   * @param commandType The type of the command
   * @param options The options for the command
   */
  addPostWriteCommand(
    command: string,
    options?: PostWriteCommandOptions,
  ): void {
    this.output.postWriteCommands.push({ command, options });
  }

  /**
   * Applies an action to the builder
   *
   * @param action The action to apply
   */
  async apply(action: BuilderAction): Promise<void> {
    await action.execute(this);
  }

  /**
   * Adds a formatter to the output that will be applied to all files depending on their extension
   *
   * @param formatter The formatter to add
   */
  addGlobalFormatter(formatter: GeneratorOutputFormatter): void {
    // check if formatter already exists for given extensions
    const existingFormatter = this.output.globalFormatters.find((f) =>
      f.fileExtensions?.some((ext) => formatter.fileExtensions?.includes(ext)),
    );

    if (existingFormatter) {
      throw new Error(
        `Formatter ${formatter.name} already exists for file extensions ${formatter.fileExtensions?.join(', ')}`,
      );
    }

    if (formatter.fileNames) {
      const existingFormatter = this.output.globalFormatters.find((f) =>
        f.fileNames?.some((name) => formatter.fileNames?.includes(name)),
      );

      if (existingFormatter) {
        throw new Error(
          `Formatter ${formatter.name} already exists for file names ${formatter.fileNames.join(', ')}`,
        );
      }
    }

    this.output.globalFormatters.push(formatter);
  }

  /**
   * Adds a dynamic task to the output
   *
   * @param name The name of the task
   * @param task The task to add
   */
  addDynamicTask(
    name: string,
    task: Omit<GeneratorTask, 'exports' | 'outputs'>,
  ): void {
    if (this.dynamicTasks.some((t) => t.task.name === task.name)) {
      throw new Error(`Dynamic task ${task.name} already exists`);
    }
    if (!task.phase) {
      throw new Error(`Dynamic task ${task.name} must have a phase`);
    }
    this.dynamicTasks.push({
      id: `${this.generatorId}#${task.name}`,
      name,
      task,
      generatorId: this.generatorId,
      generatorInfo: this.generatorInfo,
    });
  }
}
