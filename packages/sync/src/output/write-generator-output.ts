import chalk from 'chalk';

import type { Logger } from '@src/utils/evented-logger.js';

import type { GeneratorOutput } from './generator-task-output.js';
import type {
  GeneratorOutputFileWriterContext,
  PreviousGeneratedPayload,
} from './prepare-generator-files/types.js';

import { createCodebaseFileReaderFromDirectory } from './codebase-file-reader.js';
import { filterPostWriteCommands } from './post-write-commands/filter-commands.js';
import {
  runPostWriteCommands,
  sortPostWriteCommands,
} from './post-write-commands/index.js';
import { FormatterError } from './prepare-generator-files/errors.js';
import { prepareGeneratorFiles } from './prepare-generator-files/prepare-generator-files.js';
import { writeGeneratorFiles } from './write-generator-file/write-generator-files.js';

/**
 * Options for writing the generator output
 */
export interface WriteGeneratorOutputOptions {
  /**
   * Payload for the previously generated codebase
   */
  previousGeneratedPayload?: PreviousGeneratedPayload;
  /**
   * Optional directory to write the generated contents to
   */
  generatedContentsDirectory?: string;
  /**
   * Commands to re-run if there are conflicts
   */
  rerunCommands?: string[];
  /**
   * Logger to use
   */
  logger?: Logger;
}

/**
 * Result of the write generator output operation
 */
export interface WriteGeneratorOutputResult {
  /**
   * Map of file IDs to relative paths
   */
  fileIdToRelativePathMap: Map<string, string>;
  /**
   * Filenames that had conflicts
   */
  conflictFilenames: string[];
  /**
   * Commands that failed to run
   */
  failedCommands: string[];
}

// TODO [2025-01-20]: Add pendingDeleteFiles

/**
 * Write the generator output to the output directory
 *
 * @param output - The generator output to write
 * @param outputDirectory - The directory to write the output to
 * @param options - The write options
 * @returns The result of the write operation
 */
export async function writeGeneratorOutput(
  output: GeneratorOutput,
  outputDirectory: string,
  options?: WriteGeneratorOutputOptions,
): Promise<WriteGeneratorOutputResult> {
  const {
    previousGeneratedPayload,
    generatedContentsDirectory,
    rerunCommands = [],
    logger = console,
  } = options ?? {};
  // write files
  try {
    const workingCodebase =
      createCodebaseFileReaderFromDirectory(outputDirectory);
    const fileWriterContext: GeneratorOutputFileWriterContext = {
      formatters: output.globalFormatters,
      logger,
      outputDirectory,
      previousGeneratedPayload,
      previousWorkingCodebase: workingCodebase,
    };

    const { files, fileIdToRelativePathMap } = await prepareGeneratorFiles({
      files: output.files,
      context: fileWriterContext,
    });

    await writeGeneratorFiles({
      fileOperations: files,
      outputDirectory,
      generatedContentsDirectory,
    });

    const modifiedRelativePaths = new Set(
      files
        .filter((result) => result.mergedContents)
        .map((result) => result.relativePath),
    );
    const commandsToRun = filterPostWriteCommands(output.postWriteCommands, {
      modifiedRelativePaths,
      rerunCommands,
    });
    const orderedCommands = sortPostWriteCommands(commandsToRun);

    const relativePathsWithConflicts: string[] = files
      .filter((result) => result.hasConflict)
      .map((result) => result.relativePath);

    if (relativePathsWithConflicts.length > 0) {
      logger.warn(
        chalk.red(
          `Conflicts occurred while writing files:\n${relativePathsWithConflicts.join(
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
        conflictFilenames: relativePathsWithConflicts,
        failedCommands: orderedCommands.map((c) => c.command),
        fileIdToRelativePathMap,
      };
    }

    const { failedCommands } = await runPostWriteCommands(
      orderedCommands,
      outputDirectory,
      logger,
    );

    return {
      conflictFilenames: [],
      failedCommands,
      fileIdToRelativePathMap,
    };
  } catch (error) {
    if (error instanceof FormatterError) {
      logger.error(`Error formatting file: ${error.message}`);
      logger.info(`File Dump:\n${error.fileContents}`);
    }
    throw error;
  }
}
