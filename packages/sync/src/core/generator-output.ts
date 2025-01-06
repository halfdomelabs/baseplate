import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { MergeAlgorithm } from '@src/merge/types.js';
import type { Logger } from '@src/utils/evented-logger.js';

export interface WriteFileOptions {
  /**
   * Whether or not we should format the file using the default formatter
   */
  shouldFormat?: boolean;
  /**
   * Whether we should never overwrite the file (e.g. for placeholder images)
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
 * (dependencies, generation, script)
 */
type PostWriteCommandType = 'dependencies' | 'generation' | 'script';

export const POST_WRITE_COMMAND_TYPE_PRIORITY: Record<
  PostWriteCommandType,
  number
> = {
  dependencies: 0,
  generation: 1,
  script: 2,
};

export interface PostWriteCommandOptions {
  /**
   * Only run command if the provided files were changed
   */
  onlyIfChanged?: string | string[];
  /**
   * The working directory to run the command in. Defaults to output directory.
   */
  workingDirectory?: string;
}

/**
 * Builder for the output of the generator that collates the files and commands that need to be run
 */
export interface GeneratorOutputBuilder {
  /**
   * The base directory of the generator
   */
  generatorBaseDirectory: string;
  writeFile(
    filename: string,
    content: string | Buffer,
    options?: WriteFileOptions,
  ): void;
  readTemplate(templatePath: string): Promise<string>;
  addPostWriteCommand(
    command: string,
    commandType: PostWriteCommandType,
    options?: PostWriteCommandOptions,
  ): void;
  apply(action: BuilderAction): Promise<void>;
  /**
   * Resolves a path with the given base directory
   */
  resolvePath: (path: string) => string;
  /**
   * Sets the base directory for the generator output
   * (all files written will be written relative to the base directory)
   */
  setBaseDirectory: (baseDirectory: string) => void;
  /**
   * Adds a formatter for the given file extensions
   */
  addFormatter(formatter: GeneratorOutputFormatter): void;
}

export interface BuilderAction {
  execute(builder: GeneratorOutputBuilder): void | Promise<void>;
}

export type BuilderActionCreator<T extends unknown[]> = (
  ...args: T
) => BuilderAction;

export function createBuilderActionCreator<T extends unknown[]>(
  creator: (...args: T) => BuilderAction['execute'],
): BuilderActionCreator<T> {
  return (...args) => ({
    execute: (builder) => creator(...args)(builder),
  });
}

export interface FileData {
  contents: string | Buffer;
  options?: WriteFileOptions;
}

export interface PostWriteCommand {
  command: string;
  commandType: PostWriteCommandType;
  options?: PostWriteCommandOptions;
}

export type FormatFunction = (
  input: string,
  fullPath: string,
  logger: Logger,
) => Promise<string> | string;

export interface GeneratorOutputFormatter {
  /**
   * The name of the formatter
   */
  name: string;
  /**
   * The format function to use for the formatter
   */
  format: FormatFunction;
  /**
   * File extensions that this formatter should be applied to
   */
  fileExtensions?: string[];
}

export interface GeneratorOutputMetadata {
  generatorStepNodes: { id: string; label?: string }[];
  generatorStepEdges: { id: string; source: string; target: string }[];
}

export interface GeneratorOutput {
  files: Map<string, FileData>;
  postWriteCommands: PostWriteCommand[];
  formatters: GeneratorOutputFormatter[];
  metadata?: GeneratorOutputMetadata;
}

// TODO: Add unit tests

export class OutputBuilder implements GeneratorOutputBuilder {
  output: GeneratorOutput;

  generatorBaseDirectory: string;

  baseDirectory: string | undefined;

  constructor(generatorBaseDirectory: string) {
    this.output = { files: new Map(), postWriteCommands: [], formatters: [] };
    this.generatorBaseDirectory = generatorBaseDirectory;
  }

  readTemplate(templatePath: string): Promise<string> {
    const fullPath = path.join(
      this.generatorBaseDirectory,
      'templates',
      templatePath,
    );
    return fs.readFile(fullPath, 'utf8');
  }

  writeFile(
    filePath: string,
    contents: string | Buffer,
    options?: WriteFileOptions,
  ): void {
    const fullPath = this.resolvePath(filePath);

    if (this.output.files.has(fullPath)) {
      throw new Error(`Cannot overwrite file ${fullPath}`);
    }

    if (contents instanceof Buffer && options?.shouldFormat) {
      throw new Error(`Cannot format Buffer contents for ${fullPath}`);
    }

    this.output.files.set(fullPath, { contents, options });
  }

  resolvePath(relativePath: string): string {
    return (
      (
        this.baseDirectory
          ? path.join(this.baseDirectory, relativePath)
          : relativePath
      )
        // normalize all paths to POSIX style / paths
        .replaceAll(path.sep, path.posix.sep)
    );
  }

  setBaseDirectory(baseDirectory: string): void {
    this.baseDirectory = baseDirectory;
  }

  addPostWriteCommand(
    command: string,
    commandType: PostWriteCommandType,
    options?: PostWriteCommandOptions,
  ): void {
    this.output.postWriteCommands.push({ command, commandType, options });
  }

  async apply(action: BuilderAction): Promise<void> {
    await action.execute(this);
  }

  addFormatter(formatter: GeneratorOutputFormatter): void {
    // check if formatter already exists for given extensions
    const existingFormatter = this.output.formatters.find((f) =>
      f.fileExtensions?.some((ext) => formatter.fileExtensions?.includes(ext)),
    );

    if (existingFormatter) {
      throw new Error(
        `Formatter ${formatter.name} already exists for file extensions ${formatter.fileExtensions?.join(', ')}`,
      );
    }

    this.output.formatters.push(formatter);
  }
}
