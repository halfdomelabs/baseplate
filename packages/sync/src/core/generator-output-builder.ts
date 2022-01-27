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
    content: string | Buffer,
    options?: WriteFileOptions
  ): void;
  addPostWriteCommand(command: string, options?: PostWriteCommandOptions): void;
  apply(action: BuilderAction): Promise<void>;
}

export interface BuilderAction {
  execute(builder: GeneratorOutputBuilder): void | Promise<void>;
}

export type BuilderActionCreator<T extends unknown[]> = (
  ...args: T
) => BuilderAction;

export function makeBuilderActionCreator<T extends unknown[]>(
  creator: (...args: T) => BuilderAction['execute']
): BuilderActionCreator<T> {
  return (...args) => ({
    execute: (builder) => creator(...args)(builder),
  });
}
