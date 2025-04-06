/**
 * A map of pre-set priorities for post-write commands
 *
 * Lower numbers are higher priority
 */
export const POST_WRITE_COMMAND_PRIORITY = {
  /**
   * Installation of dependencies e.g. pnpm install
   */
  DEPENDENCIES: 100,
  /**
   * Code generation e.g. pnpm prisma schema
   */
  CODEGEN: 200,
  /**
   * Default phase
   */
  DEFAULT: 300,
};

/**
 * Options for a post-write command
 */
export interface PostWriteCommandOptions {
  /**
   * The priority of the command (lower is higher priority)
   *
   * See {@link POST_WRITE_COMMAND_PRIORITY} for default values.
   */
  priority?: keyof typeof POST_WRITE_COMMAND_PRIORITY | number;
  /**
   * Only run command if the provided files were changed
   */
  onlyIfChanged?: string | string[];
  /**
   * The working directory to run the command in. Defaults to package directory.
   */
  workingDirectory?: string;
  /**
   * The timeout for the command in milliseconds. Defaults to 5 minutes.
   */
  timeout?: number;
  /**
   * The environment variables to set for the command
   */
  env?: Record<string, string>;
}

/**
 * A command to run after the generation is complete
 */
export interface PostWriteCommand {
  /**
   * The command to run
   */
  command: string;
  /**
   * The options for the command
   */
  options?: PostWriteCommandOptions;
}
