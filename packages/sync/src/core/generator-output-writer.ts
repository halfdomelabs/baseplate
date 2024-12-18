import chalk from 'chalk';
import { ExecaError } from 'execa';
import _ from 'lodash';
import ms from 'ms';
import fs from 'node:fs/promises';
import path from 'node:path';
import pLimit from 'p-limit';

import type { Logger } from '@src/utils/evented-logger.js';

import { getErrorMessage } from '@src/utils/errors.js';
import { executeCommand } from '@src/utils/exec.js';
import { ensureDir, pathExists } from '@src/utils/fs.js';
import { attemptMergeJson, mergeStrings } from '@src/utils/merge.js';

import type {
  FileData,
  GeneratorOutput,
  GeneratorOutputFormatter,
} from './generator-output.js';

import { POST_WRITE_COMMAND_TYPE_PRIORITY } from './generator-output.js';

const COMMAND_TIMEOUT_MILLIS = ms('5m');

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
  formatters: GeneratorOutputFormatter[],
  logger: Logger,
): Promise<WriteFileResult> {
  // if file exists and we never overwrite, return false
  const { options, contents } = data;

  const formatter = formatters.find((f) =>
    f.fileExtensions?.some((ext) => path.extname(filePath) === ext),
  );

  if (contents instanceof Buffer) {
    if (formatter && options?.shouldFormat) {
      throw new Error(`Cannot format Buffer contents for ${filePath}`);
    }
    if (options?.neverOverwrite) {
      const fileExists = await pathExists(filePath);
      if (fileExists) {
        return { type: 'skipped', cleanContents: contents, originalPath };
      }
    }

    // we don't attempt 3-way merge on Buffer contents
    if (options?.cleanContents && contents.equals(options.cleanContents)) {
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

    if (formatter && options?.shouldFormat) {
      try {
        formattedContents = await formatter.format(
          formattedContents,
          filePath,
          logger,
        );
      } catch (error) {
        throw new FormatterError(error, formattedContents);
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

export interface GeneratorWriteOptions {
  cleanDirectory?: string;
  rerunCommands?: string[];
}

export interface GeneratorWriteResult {
  conflictFilenames: string[];
  failedCommands: string[];
}

const isModifiedFileResult = (
  result: WriteFileResult,
): result is ModifiedWriteFileResult => result.type === 'modified';

export async function writeGeneratorOutput(
  output: GeneratorOutput,
  outputDirectory: string,
  options?: GeneratorWriteOptions,
  logger: Logger = console,
): Promise<GeneratorWriteResult> {
  const { cleanDirectory, rerunCommands = [] } = options ?? {};
  // write files
  try {
    const fileResults = await Promise.all(
      [...output.files.entries()].map(([filename, file]) =>
        writeFile(
          path.join(outputDirectory, filename),
          file,
          filename,
          output.formatters,
          logger,
        ),
      ),
    );

    const modifiedFiles = fileResults.filter(isModifiedFileResult);
    const modifiedFilenames = new Set(
      modifiedFiles.map((result) => result.originalPath),
    );
    const conflictFilenames: string[] = modifiedFiles
      .filter((result) => result.hasConflict)
      .map((result) => result.originalPath);

    const writeLimit = pLimit(10);

    await Promise.all(
      modifiedFiles.map((modifiedFile) =>
        writeLimit(async () => {
          await ensureDir(path.dirname(modifiedFile.path));
          await (modifiedFile.contents instanceof Buffer
            ? fs.writeFile(modifiedFile.path, modifiedFile.contents)
            : fs.writeFile(modifiedFile.path, modifiedFile.contents, {
                encoding: 'utf8',
              }));
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
            await (fileResult.cleanContents instanceof Buffer
              ? fs.writeFile(cleanPath, fileResult.cleanContents)
              : fs.writeFile(cleanPath, fileResult.cleanContents, {
                  encoding: 'utf8',
                }));
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
        changedList.some((file) => modifiedFilenames.has(file)) ||
        rerunCommands.includes(command.command)
      );
    });

    const orderedCommands = _.sortBy(
      runnableCommands,
      (command) => POST_WRITE_COMMAND_TYPE_PRIORITY[command.commandType],
    );

    if (conflictFilenames.length > 0) {
      logger.warn(
        chalk.red(
          `Conflicts occurred while writing files:\n${conflictFilenames.join(
            '\n',
          )}`,
        ),
      );
      if (orderedCommands.length > 0) {
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
          timeout: COMMAND_TIMEOUT_MILLIS,
        });
      } catch (error) {
        logger.error(chalk.red(`Unable to run ${commandString}`));
        if (error instanceof ExecaError) {
          logger.error(error.stderr);
        } else {
          logger.error(getErrorMessage(error));
        }
        failedCommands.push(command.command);
      }
    }

    return {
      conflictFilenames: [],
      failedCommands,
    };
  } catch (error) {
    if (error instanceof FormatterError) {
      logger.error(`Error formatting file: ${error.message}`);
      logger.info(`File Dump:\n${error.fileContents}`);
    }
    throw error;
  }
}
