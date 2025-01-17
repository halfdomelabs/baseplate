import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { BuilderAction } from './builder-action.js';
import type { GeneratorOutputFormatter } from './formatter.js';
import type { MergeAlgorithm } from './merge-algorithms/types.js';

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
  neverOverwrite?: boolean;
  /**
   * Contents of the clean file (such that the diff will be merged into the existing file)
   */
  cleanContents?: Buffer;
  /**
   * Merge algorithms to use for the file
   */
  mergeAlgorithms?: MergeAlgorithm[];
}

/**
 * The type of post write command to run which specifies the order in which it is run
 *
 * - dependencies: for installing any dependencies, e.g. pnpm install
 * - generation: for generating the files, e.g. pnpm prisma schema
 * - script: for running any scripts, e.g. pnpm generate
 */
export type PostWriteCommandType = 'dependencies' | 'generation' | 'script';

/**
 * The priority of each post write command type
 */
export const POST_WRITE_COMMAND_TYPE_PRIORITY: Record<
  PostWriteCommandType,
  number
> = {
  dependencies: 0,
  generation: 1,
  script: 2,
};

/**
 * Options for a post write command
 */
export interface PostWriteCommandOptions {
  /**
   * Only run command if the provided files were changed
   */
  onlyIfChanged?: string | string[];
  /**
   * The working directory to run the command in. Defaults to package directory.
   */
  workingDirectory?: string;
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
 * A command to run after the files are written
 */
export interface PostWriteCommand {
  /**
   * The command to run
   */
  command: string;
  /**
   * The type of the command
   */
  commandType: PostWriteCommandType;
  /**
   * The options for the command
   */
  options?: PostWriteCommandOptions;
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

  constructor(generatorBaseDirectory: string) {
    this.output = {
      files: new Map(),
      postWriteCommands: [],
      globalFormatters: [],
    };
    this.generatorBaseDirectory = generatorBaseDirectory;
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

    this.output.files.set(fullPath, { id, contents, options });
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
    commandType: PostWriteCommandType,
    options?: PostWriteCommandOptions,
  ): void {
    this.output.postWriteCommands.push({ command, commandType, options });
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
