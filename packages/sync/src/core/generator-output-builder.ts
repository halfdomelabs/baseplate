export interface WriteFileOptions {
  /**
   * Whether or not we should format the file using the default formatter
   */
  shouldFormat: boolean;
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
    content: string,
    options?: WriteFileOptions
  ): void;
  addPostWriteCommand(command: string, options?: PostWriteCommandOptions): void;
}
