export interface TestRunnerContext {
  projectDirectoryPath: string;
  streamCommandOutput: boolean;
}

export interface RunCommandOptions {
  cwd?: string;
  // timeout in ms
  timeout?: number;
}

interface WaitForURLOptions {
  urls: string | string[];
  /**
   * Timeout in milliseconds after which the checking should stop if not successful.
   *
   * @default 10000
   */
  timeout?: number;
}

export interface StartBackgroundCommandOptions extends RunCommandOptions {
  waitForURL?: WaitForURLOptions;
}

export interface SetupEnvironmentHelpers {
  startDockerCompose: (composeFilePath: string) => Promise<void>;
  runCommand: (command: string, options?: RunCommandOptions) => Promise<void>;
  startBackgroundCommand: (
    command: string,
    options?: StartBackgroundCommandOptions,
  ) => Promise<void>;
  shutdown: (showOutput: boolean) => Promise<void>;
}

export interface TestRunnerHelpers {
  runCommand: (command: string, options?: RunCommandOptions) => Promise<void>;
}

export interface ProjectBuilderTest {
  /**
   * Path of project relative to root baseplate repo tests directory
   *
   * baseplate/tests/<directory>
   */
  projectDirectory: string;
  setupEnvironment: (
    context: TestRunnerContext,
    helpers: SetupEnvironmentHelpers,
  ) => Promise<void>;
  runTests: (
    context: TestRunnerContext,
    helpers: TestRunnerHelpers,
  ) => Promise<void>;
}
