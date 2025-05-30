import type { Logger } from '#src/utils/evented-logger.js';

/**
 * Function that formats the contents of a file
 *
 * @param fileContents The contents of the file to format
 * @param fullPath The full path of the file
 * @param logger The logger to use for logging any outputs
 * @returns The formatted contents of the file
 */
export type FormatFunction = (
  fileContents: string,
  fullPath: string,
  logger: Logger,
) => Promise<string> | string;

/**
 * Formatter for the generated file data
 */
export interface GeneratorOutputFormatter {
  /**
   * The name of the formatter
   */
  name: string;
  /**
   * The format function to use for the formatter
   */
  format: FormatFunction;
  /**
   * File extensions that this formatter should be applied to
   */
  fileExtensions?: string[];
  /**
   * File names that this formatter should be applied to
   */
  fileNames?: string[];
}
