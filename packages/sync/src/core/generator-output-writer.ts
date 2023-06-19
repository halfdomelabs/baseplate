import childProcess from 'child_process';
import path from 'path';
import { promisify } from 'util';
import chalk from 'chalk';
import fs from 'fs-extra';
import pLimit from 'p-limit';
import * as R from 'ramda';
import { getErrorMessage } from '@src/utils/errors';
import { Logger } from '@src/utils/evented-logger';
import { mergeStrings } from '@src/utils/merge';
import { FileData, GeneratorOutput } from './generator-output';

const exec = promisify(childProcess.exec);

async function mergeContents(
  newContents: string,
  filePath: string,
  cleanContents?: string
): Promise<{ contents: string; hasConflict: boolean } | null> {
  const pathExists = await fs.pathExists(filePath);
  if (!pathExists) {
    return { contents: newContents, hasConflict: false };
  }
  const existingContents = await fs.readFile(filePath, 'utf8');

  if (
    existingContents.includes('<<<<<<<') &&
    existingContents.includes('>>>>>>>')
  ) {
    throw new Error(`Conflict detected in ${filePath}. Stopping write.`);
  }

  // we will skip writing the file if the contents are unchanged from before or the
  // new contents matches the existing contents

  // TODO: HACK: Can create an option for this in the future
  // Necessary because package.json files are not formatted using a provided formatter
  if (filePath.endsWith('/package.json')) {
    try {
      if (
        R.equals(JSON.parse(existingContents), JSON.parse(newContents)) ||
        (cleanContents &&
          R.equals(JSON.parse(cleanContents), JSON.parse(newContents)))
      ) {
        return null;
      }
    } catch (err) {
      throw new Error(`Error parsing JSON: ${filePath}`);
    }
  } else if (
    existingContents === newContents ||
    cleanContents === newContents
  ) {
    return null;
  }

  return mergeStrings(existingContents, newContents, cleanContents);
}

interface ModifiedWriteFileResult {
  type: 'modified';
  path: string;
  contents: string | Buffer;
  cleanContents: string | Buffer;
  hasConflict?: boolean;
  originalPath: string;
}

interface SkippedWriteFileResult {
  type: 'skipped';
  originalPath: string;
  cleanContents: string | Buffer;
}

type WriteFileResult = ModifiedWriteFileResult | SkippedWriteFileResult;

class FormatterError extends Error {
  fileContents: string;

  constructor(originalError: unknown, fileContents: string) {
    if (originalError instanceof Error) {
      super(originalError.message);
    } else if (typeof originalError === 'string') {
      super(originalError);
    } else {
      super('Error not of type string or Error');
    }
    this.fileContents = fileContents;
    this.name = 'FormatterError';
  }
}

async function writeFile(
  filePath: string,
  data: FileData,
  originalPath: string,
  logger: Logger
): Promise<WriteFileResult> {
  // if file exists and we never overwrite, return false
  const { options, contents, formatter } = data;

  if (contents instanceof Buffer) {
    if (formatter) {
      throw new Error(`Cannot format Buffer contents for ${filePath}`);
    }
    if (options?.neverOverwrite) {
      const fileExists = await fs.pathExists(filePath);
      if (fileExists) {
        return { type: 'skipped', cleanContents: contents, originalPath };
      }
    }

    // we don't attempt 3-way merge on Buffer contents

    const pathExists = await fs.pathExists(filePath);
    if (pathExists) {
      const existingContents = await fs.readFile(filePath);
      if (contents.equals(existingContents)) {
        return { type: 'skipped', cleanContents: contents, originalPath };
      }
    }
    return {
      type: 'modified',
      path: filePath,
      contents,
      cleanContents: contents,
      originalPath,
    };
  }

  let formattedContents = contents;
  if (formatter) {
    try {
      formattedContents = await formatter.format(contents, filePath, logger);
    } catch (err) {
      throw new FormatterError(err, contents);
    }
  }

  if (options?.neverOverwrite) {
    const fileExists = await fs.pathExists(filePath);
    if (fileExists) {
      return {
        type: 'skipped',
        cleanContents: formattedContents,
        originalPath,
      };
    }
  }

  // check if we need to do a 3-way merge
  const cleanContents = options?.cleanContents;

  // attempt 3-way merge
  const mergeResult = await mergeContents(
    formattedContents,
    filePath,
    cleanContents
  );
  // if there's no merge result, existing contents matches new contents so no modification is required
  if (!mergeResult) {
    return { type: 'skipped', cleanContents: formattedContents, originalPath };
  }
  const { contents: mergedContents, hasConflict } = mergeResult;

  return {
    type: 'modified',
    path: filePath,
    contents: mergedContents,
    cleanContents: formattedContents,
    hasConflict,
    originalPath,
  };
}

/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

function getNodePrefix(): string {
  if (process.env.NODE_ENV === 'test') {
    return '';
  }
  if (process.env.VOLTA_HOME) {
    return 'volta run ';
  }
  return '';
}

export interface GeneratorWriteOptions {
  cleanDirectory?: string;
  rerunCommands?: string[];
}

export interface GeneratorWriteResult {
  conflictFilenames: string[];
  failedCommands: string[];
}

export async function writeGeneratorOutput(
  output: GeneratorOutput,
  outputDirectory: string,
  options?: GeneratorWriteOptions,
  logger: Logger = console
): Promise<GeneratorWriteResult> {
  const { cleanDirectory, rerunCommands = [] } = options || {};
  // write files
  const filenames = Object.keys(output.files);

  const isModifiedFileResult = (
    result: WriteFileResult
  ): result is ModifiedWriteFileResult => result.type === 'modified';

  try {
    const fileResults = await Promise.all(
      filenames.map((filename) =>
        writeFile(
          path.join(outputDirectory, filename),
          output.files[filename],
          filename,
          logger
        )
      )
    );

    const modifiedFiles = fileResults.filter(isModifiedFileResult);
    const modifiedFilenames = modifiedFiles.map(
      (result) => result.originalPath
    );
    const conflictFilenames: string[] = modifiedFiles
      .filter((result) => result.hasConflict)
      .map((result) => result.originalPath);

    const writeLimit = pLimit(10);

    await Promise.all(
      modifiedFiles.map((modifiedFile) =>
        writeLimit(async () => {
          await fs.ensureDir(path.dirname(modifiedFile.path));
          if (modifiedFile.contents instanceof Buffer) {
            await fs.writeFile(modifiedFile.path, modifiedFile.contents);
          } else {
            await fs.writeFile(modifiedFile.path, modifiedFile.contents, {
              encoding: 'utf-8',
            });
          }
        })
      )
    );

    // Write clean directory
    if (cleanDirectory) {
      await Promise.all(
        fileResults.map((fileResult) =>
          writeLimit(async () => {
            const cleanPath = path.join(
              cleanDirectory,
              fileResult.originalPath
            );
            await fs.ensureDir(path.dirname(cleanPath));
            if (fileResult.cleanContents instanceof Buffer) {
              await fs.writeFile(cleanPath, fileResult.cleanContents);
            } else {
              await fs.writeFile(cleanPath, fileResult.cleanContents, {
                encoding: 'utf-8',
              });
            }
          })
        )
      );
    }

    const runnableCommands = output.postWriteCommands.filter((command) => {
      const { onlyIfChanged = [] } = command.options || {};
      const changedList = Array.isArray(onlyIfChanged)
        ? onlyIfChanged
        : [onlyIfChanged];

      return (
        command.options?.onlyIfChanged == null ||
        changedList.some((file) => modifiedFilenames.includes(file)) ||
        rerunCommands.includes(command.command)
      );
    });

    if (conflictFilenames.length) {
      logger.log(
        chalk.red(
          `Conflicts occurred while writing files:\n${conflictFilenames.join(
            '\n'
          )}`
        )
      );
      if (runnableCommands.length) {
        logger.log(
          `\nOnce resolved, please re-run the generator or run the following commands:`
        );
        for (const command of runnableCommands) {
          logger.log(`  ${command.command}`);
        }
      }
      return {
        conflictFilenames,
        failedCommands: runnableCommands.map((c) => c.command),
      };
    }

    // run post write commands

    // Volta and Yarn prepend their own PATHs to Node which can
    // bugger up node resolution. This forces it to run normally again
    const nodePrefix = getNodePrefix();
    const NODE_COMMANDS = ['node', 'yarn', 'npm'];

    const failedCommands: string[] = [];

    for (const command of runnableCommands) {
      const { workingDirectory = '' } = command.options || {};

      const commandString = NODE_COMMANDS.includes(
        command.command.split(' ')[0]
      )
        ? `${nodePrefix}${command.command}`
        : command.command;

      logger.log(`Running ${commandString}...`);
      try {
        await exec(commandString, {
          cwd: path.join(outputDirectory, workingDirectory),
        });
      } catch (err) {
        logger.error(chalk.red(`Unable to run ${commandString}`));
        logger.error(getErrorMessage(err));
        failedCommands.push(command.command);
      }
    }

    return {
      conflictFilenames: [],
      failedCommands,
    };
  } catch (err) {
    if (err instanceof FormatterError) {
      logger.error(`Error formatting file: ${err.message}`);
      logger.log(`File Dump:\n${err.fileContents}`);
    }
    throw err;
  }
}
