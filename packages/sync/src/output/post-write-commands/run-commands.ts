import chalk from 'chalk';
import ms from 'ms';
import path from 'node:path';

import type { Logger } from '#src/utils/evented-logger.js';

import { executeCommand } from '#src/utils/exec.js';

import { type PostWriteCommand } from './types.js';

const COMMAND_TIMEOUT_MILLIS = ms('5m');

export interface FailedCommandInfo {
  command: string;
  workingDir: string;
  output?: string | undefined;
}

/**
 * Run post-write commands
 *
 * @param commands - The commands to run
 * @param outputDirectory - The output directory
 * @param logger - The logger to use
 * @param abortSignal - The abort signal to use for cancelling the command run
 * @returns The failed commands
 */
export async function runPostWriteCommands(
  commands: PostWriteCommand[],
  outputDirectory: string,
  logger: Logger,
  abortSignal?: AbortSignal,
): Promise<{
  failedCommands: FailedCommandInfo[];
}> {
  const failedCommands: FailedCommandInfo[] = [];

  for (const command of commands) {
    const { workingDirectory = '' } = command.options ?? {};

    const commandString = command.command;

    logger.info(`Running ${commandString}...`);
    try {
      if (abortSignal?.aborted) {
        throw new Error('Sync cancelled');
      }

      const result = await executeCommand(commandString, {
        cwd: path.join(outputDirectory, workingDirectory),
        timeout: command.options?.timeout ?? COMMAND_TIMEOUT_MILLIS,
        env: command.options?.env,
        abortSignal,
      });

      if (result.failed) {
        logger.error(
          chalk.red(
            `${commandString} failed with exit code ${result.exitCode}`,
          ),
        );
        logger.error(chalk.red(result.output));
        failedCommands.push({
          command: command.command,
          workingDir: path.join(outputDirectory, workingDirectory),
          output: result.output,
        });
      }
    } catch (error) {
      logger.error(
        chalk.red(`${commandString} failed to run: ${String(error)}`),
      );
      failedCommands.push({
        command: command.command,
        workingDir: path.join(outputDirectory, workingDirectory),
      });
    }
  }

  return {
    failedCommands,
  };
}
