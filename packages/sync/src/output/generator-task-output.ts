import { promises as fs } from 'node:fs';
import path from 'node:path';

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
  generatorStepNodes: {
    id: string;
    label?: string;
  }[];
  generatorStepEdges: {
    id: string;
    source: string;
    target: string;
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
   * The base directory of the generator code (useful for reading templates)
   */
  generatorBaseDirectory: string;
  /**
   * The name of the generator
   */
  generatorName: string;
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
   * The base directory of the generator code (useful for reading templates)
   */
  generatorBaseDirectory: string;

  /**
   * The name of the generator
   */
  generatorName: string;

  constructor(context: GeneratorTaskOutputBuilderContext) {
    this.output = {
      files: new Map(),
      postWriteCommands: [],
      globalFormatters: [],
    };
    this.generatorBaseDirectory = context.generatorBaseDirectory;
    this.generatorName = context.generatorName;
  }

  /**
   * Reads a template file from the generator base directory
   *
   * @param templatePath The path to the template file relative to the templates directory
   * @returns The contents of the template file
   */
  readTemplate(templatePath: string): Promise<string> {
    const fullPath = path.join(
      this.generatorBaseDirectory,
      'templates',
      templatePath,
    );
    return fs.readFile(fullPath, 'utf8');
  }

  /**
   * Writes a file to the output
   *
   * @param filePath The path to the file relative to the base directory
   * @param contents The contents of the file
   * @param options The options for the file
   */
  writeFile({
    id,
    filePath,
    contents,
    options,
  }: {
    id: string;
    filePath: string;
    contents: string | Buffer;
    options?: WriteFileOptions;
  }): void {
    const fullPath = this.resolvePath(filePath);

    if (this.output.files.has(fullPath)) {
      throw new Error(`Cannot overwrite file ${fullPath}`);
    }

    if (contents instanceof Buffer && options?.shouldFormat) {
      throw new Error(`Cannot format Buffer contents for ${fullPath}`);
    }

    this.output.files.set(fullPath, {
      id: `${this.generatorName}:${id}`,
      contents,
      options,
    });
  }

  /**
   * Resolves a path
   *
   * @param relativePath The path to resolve relative to the base directory
   * @returns The resolved path
   */
  resolvePath(relativePath: string): string {
    // normalize all paths to POSIX style / paths
    return relativePath.replaceAll(path.sep, path.posix.sep);
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

    this.output.globalFormatters.push(formatter);
  }
}
