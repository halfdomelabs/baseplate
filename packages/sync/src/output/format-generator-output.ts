import type { Logger } from '#src/utils/index.js';

import type { GeneratorOutputFormatter } from './formatter.js';
import type {
  GeneratorTaskOutput,
  WriteFileOptions,
} from './generator-task-output.js';

import { formatOutputFileContents } from './prepare-generator-files/prepare-generator-file.js';

/**
 * Options for formatting generator output
 */
export interface FormatGeneratorOutputOptions {
  /**
   * Output directory for the files (used by formatters)
   */
  outputDirectory: string;
  /**
   * Logger to use for formatting operations
   */
  logger?: Logger;
}

/**
 * Result of formatting generator output
 */
export interface FormatGeneratorOutputResult {
  /**
   * Map of file paths to formatted file data
   */
  files: Map<
    string,
    { id: string; contents: Buffer | string; options?: WriteFileOptions }
  >;
  /**
   * The commands to run after the files are written
   */
  postWriteCommands: GeneratorTaskOutput['postWriteCommands'];
  /**
   * The formatters that will be applied to all files depending on their extension
   */
  globalFormatters: GeneratorOutputFormatter[];
}

/**
 * Format all files in a generator task output using the available formatters
 *
 * @param output - The generator task output to format
 * @param options - Options for formatting
 * @returns The formatted generator output
 */
export async function formatGeneratorOutput(
  output: GeneratorTaskOutput,
  options: FormatGeneratorOutputOptions,
): Promise<FormatGeneratorOutputResult> {
  const { outputDirectory, logger = console } = options;
  const formattedFiles = new Map<
    string,
    { id: string; contents: Buffer | string; options?: WriteFileOptions }
  >();

  // Process each file in the output
  for (const [relativePath, fileData] of output.files.entries()) {
    const formattedContents = await formatOutputFileContents(
      relativePath,
      fileData,
      {
        outputDirectory,
        formatters: output.globalFormatters,
        logger,
      },
    );

    formattedFiles.set(relativePath, {
      id: fileData.id,
      contents: formattedContents,
      options: fileData.options,
    });
  }

  return {
    files: formattedFiles,
    postWriteCommands: output.postWriteCommands,
    globalFormatters: output.globalFormatters,
  };
}
