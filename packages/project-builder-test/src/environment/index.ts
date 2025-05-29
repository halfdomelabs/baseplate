import type { ExecaError, Options as ExecaOptions } from 'execa';

import { execa, parseCommandString } from 'execa';
import path from 'node:path';
import ora, { oraPromise } from 'ora';
import { DockerComposeEnvironment } from 'testcontainers';

import type { SetupEnvironmentHelpers, TestRunnerContext } from '#src/types.js';

import { HandledError } from '#src/errors/handled-error.js';
import { logger } from '#src/utils/console.js';
import { safeKillProcessGroup } from '#src/utils/kill-process-group.js';
import { shouldEnableOra } from '#src/utils/ora.js';
import { isExitingProcess, onProcessExit } from '#src/utils/process.js';
import { waitForHealthyUrl } from '#src/utils/url.js';

export function createEnvironmentHelpers({
  projectDirectoryPath,
  streamCommandOutput,
}: TestRunnerContext): SetupEnvironmentHelpers {
  const shutdownCommands: ((showOutput: boolean) => unknown)[] = [];
  const isOraEnabled = shouldEnableOra() && !streamCommandOutput;
  return {
    async startDockerCompose(relativeComposeFilePath: string): Promise<void> {
      const composeFilePath = path.join(
        projectDirectoryPath,
        relativeComposeFilePath,
      );
      const composePath = path.dirname(composeFilePath);
      const composeFilename = path.basename(composeFilePath);
      const environment = new DockerComposeEnvironment(
        composePath,
        composeFilename,
      );
      const startedEnvironment = await oraPromise(environment.up(), {
        text: `Starting Docker Compose...`,
        isEnabled: isOraEnabled,
        successText: `Docker Compose for ${relativeComposeFilePath} started!`,
        failText: `Failed to start Docker Compose for ${relativeComposeFilePath}`,
      });
      shutdownCommands.push(() => startedEnvironment.down());
      if (isExitingProcess()) {
        throw new HandledError();
      }
    },
    async runCommand(command, options = {}): Promise<void> {
      const spinner = ora({
        text: `Running command: ${path.join(options.cwd ?? '', command)}`,
        isEnabled: isOraEnabled,
      }).start();
      const [file, ...commandArguments] = parseCommandString(command);
      const controller = new AbortController();

      const removeListener = onProcessExit(() => {
        controller.abort();
      });
      const execAOptions: ExecaOptions = {
        cwd: path.join(projectDirectoryPath, options.cwd ?? ''),
        timeout: options.timeout ?? 30_000,
        cancelSignal: controller.signal,
      };
      try {
        await execa(
          file,
          commandArguments,
          streamCommandOutput
            ? {
                ...execAOptions,
                stdin: 'inherit',
                stdout: 'inherit',
                stderr: 'inherit',
                extendEnv: true,
              }
            : {
                ...execAOptions,
                all: true,
                extendEnv: true,
                env: { CI: 'true' },
              },
        ).catch((err: unknown) => {
          if (isExitingProcess()) {
            spinner.fail(`Command aborted before finishing: ${command}`);
            throw new HandledError();
          }
          if (err instanceof Error) {
            const execErr = err as ExecaError;
            spinner.fail(
              `Failed to run command: ${command} (exit code ${execErr.exitCode}): ${execErr.shortMessage}`,
            );
            if (!streamCommandOutput) {
              logger.log(execErr.all);
            }

            throw new HandledError();
          }
          throw err;
        });
        spinner.succeed(`Ran ${command} successfully!`);
      } catch (err) {
        if (err instanceof HandledError) {
          throw err;
        }
        spinner.fail(`Failed to run command: ${command}`);
        throw err;
      } finally {
        removeListener();
      }

      if (isExitingProcess()) {
        throw new HandledError();
      }
    },
    async startBackgroundCommand(command, options = {}): Promise<void> {
      const execAOptions: ExecaOptions = {
        cwd: path.join(projectDirectoryPath, options.cwd ?? ''),
        forceKillAfterDelay: 10_000,
        detached: true,
        reject: false,
      };
      const [file, ...commandArguments] = parseCommandString(command);
      const childProcess = execa(
        file,
        commandArguments,
        streamCommandOutput
          ? {
              ...execAOptions,
              stdout: 'inherit',
              stderr: 'inherit',
            }
          : {
              ...execAOptions,
              all: true,
              extendEnv: true,
              env: { CI: 'true' },
            },
      );

      shutdownCommands.push(async (showOutput) => {
        await safeKillProcessGroup(childProcess);
        if (showOutput && !streamCommandOutput) {
          const all = await childProcess
            .then((result) => result.all)
            .catch((err: unknown) => (err as ExecaError).all);
          logger.log(all);
        }
      });

      if (options.waitForURL) {
        const { urls, timeout = 10_000 } = options.waitForURL;
        const urlArray = Array.isArray(urls) ? urls : [urls];
        await oraPromise(
          Promise.all(urlArray.map((url) => waitForHealthyUrl(url, timeout))),
          {
            text: `Waiting for URL(s) to be available: ${urlArray.join(', ')}`,
            isEnabled: isOraEnabled,
            successText: `Command started successfully in background: ${command}`,
            failText: `Failed to wait for URL(s) to be available: ${urlArray.join(', ')}`,
          },
        );
      } else {
        logger.log(`Started command in background: ${command}`);
      }
    },
    async shutdown(showOutput: boolean): Promise<void> {
      const spinner = ora({
        text: `Shutting down project environment...`,
        isEnabled: isOraEnabled,
        discardStdin: false,
      }).start();
      try {
        for (const command of shutdownCommands) {
          await command(showOutput);
        }
        spinner.succeed(`Project environment shut down.`);
      } catch (e) {
        spinner.fail(`Failed to shut down project environment.`);
        logger.error(e);
      }
    },
  };
}
