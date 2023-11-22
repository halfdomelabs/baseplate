import chalk from 'chalk';
import fs from 'fs/promises';
import _ from 'lodash';
import pLimit from 'p-limit';
import path from 'path';

import {
  FileData,
  GeneratorOutput,
  POST_WRITE_COMMAND_TYPE_PRIORITY,
} from './generator-output.js';
import { getErrorMessage } from '@src/utils/errors.js';
import { Logger } from '@src/utils/evented-logger.js';
import { ExecError, executeCommand } from '@src/utils/exec.js';
import { ensureDir, pathExists } from '@src/utils/fs.js';
import { attemptMergeJson, mergeStrings } from '@src/utils/merge.js';

async function mergeContents(
  newContents: string,
  filePath: string,
  formatContents: (contents: string) => Promise<string>,
  cleanContents?: string,
): Promise<{ contents: string; hasConflict: boolean } | null> {
  if (cleanContents === newContents) {
    // don't write if content has not changed
    return null;
  }

  const doesPathExist = await pathExists(filePath);
  if (!doesPathExist) {
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
  if (existingContents === newContents) {
    return null;
  }

  // if the file is JSON, attempt a patch diff to avoid messy 3-way diff
  if (filePath.endsWith('.json') && cleanContents) {
    const mergedContents = attemptMergeJson(
      existingContents,
      newContents,
      cleanContents,
    );
    if (mergedContents) {
      const formattedMergedContents = await formatContents(mergedContents);
      return { contents: formattedMergedContents, hasConflict: false };
    }
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
  logger: Logger,
): Promise<WriteFileResult> {
  // if file exists and we never overwrite, return false
  const { options, contents, formatter } = data;

  if (contents instanceof Buffer) {
    if (formatter) {
      throw new Error(`Cannot format Buffer contents for ${filePath}`);
    }
    if (options?.neverOverwrite) {
      const fileExists = await pathExists(filePath);
      if (fileExists) {
        return { type: 'skipped', cleanContents: contents, originalPath };
      }
    }

    // we don't attempt 3-way merge on Buffer contents
    if (options?.cleanContents && contents.equals(options?.cleanContents)) {
      return { type: 'skipped', cleanContents: contents, originalPath };
    }

    const doesPathExist = await pathExists(filePath);
    if (doesPathExist) {
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

  async function formatContents(contentsToFormat: string): Promise<string> {
    let formattedContents = contentsToFormat;
    if (options?.preformat) {
      try {
        formattedContents = await Promise.resolve(
          options.preformat(formattedContents, filePath, logger),
        );
      } catch (err) {
        throw new FormatterError(err, formattedContents);
      }
    }

    if (formatter) {
      try {
        formattedContents = await formatter.format(
          formattedContents,
          filePath,
          logger,
        );
      } catch (err) {
        throw new FormatterError(err, formattedContents);
      }
    }
    return formattedContents;
  }

  const formattedContents = await formatContents(contents);

  if (options?.neverOverwrite) {
    const fileExists = await pathExists(filePath);
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
    formatContents,
    cleanContents?.toString('utf8'),
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
  logger: Logger = console,
): Promise<GeneratorWriteResult> {
  const { cleanDirectory, rerunCommands = [] } = options ?? {};
  // write files
  const filenames = Object.keys(output.files);

  const isModifiedFileResult = (
    result: WriteFileResult,
  ): result is ModifiedWriteFileResult => result.type === 'modified';

  try {
    const fileResults = await Promise.all(
      filenames.map((filename) =>
        writeFile(
          path.join(outputDirectory, filename),
          output.files[filename],
          filename,
          logger,
        ),
      ),
    );

    const modifiedFiles = fileResults.filter(isModifiedFileResult);
    const modifiedFilenames = modifiedFiles.map(
      (result) => result.originalPath,
    );
    const conflictFilenames: string[] = modifiedFiles
      .filter((result) => result.hasConflict)
      .map((result) => result.originalPath);

    const writeLimit = pLimit(10);

    await Promise.all(
      modifiedFiles.map((modifiedFile) =>
        writeLimit(async () => {
          await ensureDir(path.dirname(modifiedFile.path));
          if (modifiedFile.contents instanceof Buffer) {
            await fs.writeFile(modifiedFile.path, modifiedFile.contents);
          } else {
            await fs.writeFile(modifiedFile.path, modifiedFile.contents, {
              encoding: 'utf-8',
            });
          }
        }),
      ),
    );

    // Write clean directory
    if (cleanDirectory) {
      await Promise.all(
        fileResults.map((fileResult) =>
          writeLimit(async () => {
            const cleanPath = path.join(
              cleanDirectory,
              fileResult.originalPath,
            );
            await ensureDir(path.dirname(cleanPath));
            if (fileResult.cleanContents instanceof Buffer) {
              await fs.writeFile(cleanPath, fileResult.cleanContents);
            } else {
              await fs.writeFile(cleanPath, fileResult.cleanContents, {
                encoding: 'utf-8',
              });
            }
          }),
        ),
      );
    }

    const runnableCommands = output.postWriteCommands.filter((command) => {
      const { onlyIfChanged = [] } = command.options ?? {};
      const changedList = Array.isArray(onlyIfChanged)
        ? onlyIfChanged
        : [onlyIfChanged];

      return (
        command.options?.onlyIfChanged == null ||
        changedList.some((file) => modifiedFilenames.includes(file)) ||
        rerunCommands.includes(command.command)
      );
    });

    const orderedCommands = _.sortBy(
      runnableCommands,
      (command) => POST_WRITE_COMMAND_TYPE_PRIORITY[command.commandType],
    );

    if (conflictFilenames.length) {
      logger.warn(
        chalk.red(
          `Conflicts occurred while writing files:\n${conflictFilenames.join(
            '\n',
          )}`,
        ),
      );
      if (orderedCommands.length) {
        logger.warn(
          `\nOnce resolved, please re-run the generator or run the following commands:`,
        );
        for (const command of orderedCommands) {
          logger.warn(`  ${command.command}`);
        }
      }
      return {
        conflictFilenames,
        failedCommands: orderedCommands.map((c) => c.command),
      };
    }

    const failedCommands: string[] = [];

    for (const command of orderedCommands) {
      const { workingDirectory = '' } = command.options ?? {};

      const commandString = command.command;

      logger.info(`Running ${commandString}...`);
      try {
        await executeCommand(commandString, {
          cwd: path.join(outputDirectory, workingDirectory),
        });
      } catch (err) {
        logger.error(chalk.red(`Unable to run ${commandString}`));
        if (err instanceof ExecError) {
          logger.error(err.stderr);
        } else {
          logger.error(getErrorMessage(err));
        }
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
      logger.info(`File Dump:\n${err.fileContents}`);
    }
    throw err;
  }
}
