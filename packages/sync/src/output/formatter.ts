import type { Logger } from '#src/utils/evented-logger.js';

/**
 * Per-file options passed to a format function.
 */
export interface FormatFunctionOptions {
  /**
   * Absolute paths of the formatter's declared inputs, mirrored for this
   * formatting operation, keyed by the output-relative path that was declared.
   *
   * Empty when materialization was skipped, in which case a formatter that reads
   * project files should fall back to their working-tree locations.
   */
  readonly materializedFormatterInputs?: ReadonlyMap<string, string>;
  /**
   * Root of the project being formatted.
   *
   * Formatters that resolve tooling from the project should anchor on this
   * rather than the file being formatted, whose directory varies with which file
   * the concurrency limiter happened to schedule first.
   */
  readonly outputDirectory?: string;
}

/**
 * Function that formats the contents of a file
 *
 * @param fileContents The contents of the file to format
 * @param fullPath The full path of the file
 * @param logger The logger to use for logging any outputs
 * @param options Per-file formatting options
 * @returns The formatted contents of the file
 */
export type FormatFunction = (
  fileContents: string,
  fullPath: string,
  logger: Logger,
  options?: FormatFunctionOptions,
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
  /**
   * Output-relative paths this formatter reads from disk while formatting.
   *
   * They are mirrored into a directory owned by the formatting operation so that
   * formatting sees this sync's version of them rather than the working tree's.
   * Imports are not followed, so a file reached only through another input's
   * relative import must be listed here as well.
   */
  materializedFormatterInputs?: string[];
}
