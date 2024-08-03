import {
  ExecaError,
  Options as ExecaOptions,
  execa,
  parseCommandString,
} from 'execa';
import path from 'node:path';
import ora from 'ora';
import { DockerComposeEnvironment } from 'testcontainers';

import { HandledError } from '@src/errors/handled-error.js';
import { SetupEnvironmentHelpers, TestRunnerContext } from '@src/types.js';
import { logger } from '@src/utils/console.js';

export function createEnvironmentHelpers({
  projectDirectoryPath,
  streamCommandOutput,
}: TestRunnerContext): SetupEnvironmentHelpers {
  const shutdownCommands: ((showOutput: boolean) => unknown)[] = [];
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
      const spinner = ora({
        text: `Starting Docker Compose for ${relativeComposeFilePath}...`,
        isEnabled: !streamCommandOutput,
      }).start();
      try {
        const startedEnvironment = await environment.up();
        shutdownCommands.push(() => startedEnvironment.down());
        spinner.succeed(
          `Docker Compose for ${relativeComposeFilePath} started!`,
        );
      } catch (error) {
        spinner.fail(
          `Failed to start Docker Compose for ${relativeComposeFilePath}`,
        );
        throw error;
      }
    },
    async runCommand(command, options = {}): Promise<void> {
      const execAOptions: ExecaOptions = {
        cwd: path.join(projectDirectoryPath, options.cwd ?? ''),
        timeout: options?.timeout ?? 30000,
      };
      const spinner = ora({
        text: `Running command: ${path.join(options.cwd ?? '', command)}`,
        isEnabled: !streamCommandOutput,
      }).start();
      const [file, ...commandArguments] = parseCommandString(command);
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
              }
            : {
                ...execAOptions,
                all: true,
                extendEnv: true,
                env: { CI: 'true' },
              },
        ).catch((err) => {
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
      }
    },
    startCommand(command, options = {}): void {
      const execAOptions: ExecaOptions = {
        cwd: path.join(projectDirectoryPath, options.cwd ?? ''),
        forceKillAfterDelay: 5000,
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
              stdout: 'ignore',
              stderr: 'ignore',
              extendEnv: true,
              env: { CI: 'true' },
            },
      );
      logger.log(`Started command in background: ${command}`);

      shutdownCommands.push(async (showOutput) => {
        childProcess.kill();
        if (showOutput && !streamCommandOutput) {
          console.log('why did we not get a result');
          const all = await childProcess
            .then((result) => {
              console.log('reached then!');
              return result.all;
            })
            .catch((err) => {
              console.log('execerro');
              return (err as ExecaError).all;
            });
          console.log('we got a result');
          logger.log(all);
        }
      });
    },
    async shutdown(showOutput: boolean): Promise<void> {
      const spinner = ora({
        text: `Shutting down project environment...`,
        isEnabled: !streamCommandOutput && false,
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
