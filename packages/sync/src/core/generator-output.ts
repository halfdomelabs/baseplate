import { promises as fs } from 'fs';
import path from 'path';
import { FormatterProvider } from '../providers';

export interface WriteFileOptions {
  /**
   * Whether or not we should format the file using the default formatter
   */
  shouldFormat?: boolean;
  /**
   * Whether we should never overwrite the file (e.g. for placeholder images)
   */
  neverOverwrite?: boolean;
}

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
    options?: WriteFileOptions
  ): void;
  readTemplate(templatePath: string): Promise<string>;
  addPostWriteCommand(command: string, options?: PostWriteCommandOptions): void;
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
}

export interface BuilderAction {
  execute(builder: GeneratorOutputBuilder): void | Promise<void>;
}

export type BuilderActionCreator<T extends unknown[]> = (
  ...args: T
) => BuilderAction;

export function createBuilderActionCreator<T extends unknown[]>(
  creator: (...args: T) => BuilderAction['execute']
): BuilderActionCreator<T> {
  return (...args) => ({
    execute: (builder) => creator(...args)(builder),
  });
}

export interface FileData {
  contents: string | Buffer;
  formatter?: FormatterProvider;
  options?: WriteFileOptions;
}

interface PostWriteCommand {
  command: string;
  options?: PostWriteCommandOptions;
}

export interface GeneratorOutput {
  files: Record<string, FileData>;
  postWriteCommands: PostWriteCommand[];
}

// TODO: Add unit tests

export class OutputBuilder implements GeneratorOutputBuilder {
  output: GeneratorOutput;

  generatorBaseDirectory: string;

  formatter: FormatterProvider | undefined;

  baseDirectory: string | undefined;

  constructor(generatorBaseDirectory: string, formatter?: FormatterProvider) {
    this.output = { files: {}, postWriteCommands: [] };
    this.generatorBaseDirectory = generatorBaseDirectory;
    this.formatter = formatter;
  }

  readTemplate(templatePath: string): Promise<string> {
    const fullPath = path.join(
      this.generatorBaseDirectory,
      'templates',
      templatePath
    );
    return fs.readFile(fullPath, 'utf8');
  }

  writeFile(
    filePath: string,
    contents: string | Buffer,
    options?: WriteFileOptions
  ): void {
    const fullPath = this.resolvePath(filePath);
    if (this.output.files[fullPath]) {
      throw new Error(`Cannot overwrite file ${fullPath}`);
    }

    if (contents instanceof Buffer && options?.shouldFormat) {
      throw new Error(`Cannot format Buffer contents for ${fullPath}`);
    }
    const formatter =
      this.formatter && options?.shouldFormat ? this.formatter : undefined;
    this.output.files[fullPath] = { contents, formatter, options };
  }

  resolvePath(relativePath: string): string {
    return this.baseDirectory
      ? path.join(this.baseDirectory, relativePath)
      : relativePath;
  }

  setBaseDirectory(baseDirectory: string): void {
    this.baseDirectory = baseDirectory;
  }

  addPostWriteCommand(
    command: string,
    options?: PostWriteCommandOptions
  ): void {
    this.output.postWriteCommands.push({ command, options });
  }

  async apply(action: BuilderAction): Promise<void> {
    await action.execute(this);
  }
}
