import chalk from 'chalk';
import { ExecaError } from 'execa';
import ms from 'ms';
import path from 'node:path';

import type { Logger } from '@src/utils/evented-logger.js';

import { executeCommand } from '@src/utils/exec.js';

import { type PostWriteCommand } from './types.js';

const COMMAND_TIMEOUT_MILLIS = ms('5m');

/**
 * Run post-write commands
 *
 * @param commands - The commands to run
 * @param outputDirectory - The output directory
 * @param logger - The logger to use
 * @returns The failed commands
 */
export async function runPostWriteCommands(
  commands: PostWriteCommand[],
  outputDirectory: string,
  logger: Logger,
): Promise<{
  failedCommands: string[];
}> {
  const failedCommands: string[] = [];

  for (const command of commands) {
    const { workingDirectory = '' } = command.options ?? {};

    const commandString = command.command;

    logger.info(`Running ${commandString}...`);
    try {
      await executeCommand(commandString, {
        cwd: path.join(outputDirectory, workingDirectory),
        timeout: command.options?.timeout ?? COMMAND_TIMEOUT_MILLIS,
        env: command.options?.env,
      });
    } catch (error) {
      logger.error(chalk.red(`Unable to run ${commandString}`));
      if (error instanceof ExecaError) {
        logger.error(error.stderr);
      } else {
        logger.error(String(error));
      }
      failedCommands.push(command.command);
    }
  }

  return {
    failedCommands,
  };
}
