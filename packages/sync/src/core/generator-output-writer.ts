import chalk from 'chalk';
import { ExecaError } from 'execa';
import _ from 'lodash';
import ms from 'ms';
import fs from 'node:fs/promises';
import path from 'node:path';
import pLimit from 'p-limit';

import type { MergeAlgorithm, MergeResult } from '@src/merge/types.js';
import type { Logger } from '@src/utils/evented-logger.js';

import { buildCompositeMergeAlgorithm } from '@src/merge/composite-merge.js';
import { diff3MergeAlgorithm } from '@src/merge/diff3.js';
import { jsonMergeAlgorithm } from '@src/merge/json.js';
import { simpleDiffAlgorithm } from '@src/merge/simple-diff.js';
import { getErrorMessage } from '@src/utils/errors.js';
import { executeCommand } from '@src/utils/exec.js';
import { ensureDir, pathExists } from '@src/utils/fs.js';

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
  mergeAlgorithms?: MergeAlgorithm[],
): Promise<MergeResult> {
  // don't write if content has not changed
  if (cleanContents === newContents) {
    return null;
  }

  const doesPathExist = await pathExists(filePath);
  if (!doesPathExist) {
    return { mergedText: newContents, hasConflict: false };
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

  if (!cleanContents) {
    return simpleDiffAlgorithm(existingContents, newContents);
  }

  const mergeAlgorithm = buildCompositeMergeAlgorithm([
    ...(mergeAlgorithms ?? []),
    ...(filePath.endsWith('.json') ? [jsonMergeAlgorithm] : []),
    diff3MergeAlgorithm,
  ]);

  const mergeResult = await mergeAlgorithm(
    existingContents,
    newContents,
    cleanContents,
    { formatContents },
  );

  if (mergeResult) {
    return mergeResult;
  }

  throw new Error(`Unable to merge ${filePath}`);
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

async function prepareFileContents({
  filePath,
  data,
  originalPath,
  formatters,
  logger,
}: {
  filePath: string;
  data: FileData;
  originalPath: string;
  formatters: GeneratorOutputFormatter[];
  logger: Logger;
}): Promise<WriteFileResult> {
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
  const { mergedText, hasConflict } = mergeResult;

  return {
    type: 'modified',
    path: filePath,
    contents: mergedText,
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

/**
 * Write the generator output to the output directory
 * @param output - The generator output to write
 * @param outputDirectory - The directory to write the output to
 * @param options - The write options
 * @param logger - The logger to use
 * @returns The result of the write operation
 */
export async function writeGeneratorOutput(
  output: GeneratorOutput,
  outputDirectory: string,
  options?: GeneratorWriteOptions,
  logger: Logger = console,
): Promise<GeneratorWriteResult> {
  const { cleanDirectory, rerunCommands = [] } = options ?? {};
  // write files
  try {
    const writeLimit = pLimit(10);
    const fileResults = await Promise.all(
      Array.from(output.files.entries(), ([filename, file]) =>
        writeLimit(() =>
          prepareFileContents({
            filePath: path.join(outputDirectory, filename),
            data: file,
            originalPath: filename,
            formatters: output.formatters,
            logger,
          }),
        ),
      ),
    );

    const modifiedFiles = fileResults.filter(
      (result) => result.type === 'modified',
    );
    const conflictFilenames: string[] = modifiedFiles
      .filter((result) => result.hasConflict)
      .map((result) => result.originalPath);

    const writeFileWithContents = async (
      filePath: string,
      contents: Buffer | string,
    ): Promise<void> => {
      await ensureDir(path.dirname(filePath));
      await (contents instanceof Buffer
        ? fs.writeFile(filePath, contents)
        : fs.writeFile(filePath, contents, {
            encoding: 'utf8',
          }));
    };

    await Promise.all(
      modifiedFiles.map((modifiedFile) =>
        writeLimit(() =>
          writeFileWithContents(modifiedFile.path, modifiedFile.contents),
        ),
      ),
    );

    // Write clean directory
    if (cleanDirectory) {
      await Promise.all(
        fileResults.map((fileResult) =>
          writeLimit(() =>
            writeFileWithContents(
              path.join(cleanDirectory, fileResult.originalPath),
              fileResult.cleanContents,
            ),
          ),
        ),
      );
    }

    const modifiedFilenames = new Set(
      modifiedFiles.map((result) => result.originalPath),
    );

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
