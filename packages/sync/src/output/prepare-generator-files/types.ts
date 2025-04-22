import type { Logger } from '@src/utils/evented-logger.js';

import type { CodebaseFileReader } from '../codebase-file-reader.js';
import type { GeneratorOutputFormatter } from '../formatter.js';
import type { GitMergeDriverConfig } from '../string-merge-algorithms/git-merge-driver.js';

/**
 * Payload for the previously generated codebase
 */
export interface PreviousGeneratedPayload {
  /**
   * Function to read the base generated file contents
   */
  readonly fileReader: CodebaseFileReader;
  /**
   * Map of file IDs to their relative paths
   */
  readonly fileIdToRelativePathMap: Map<string, string>;
}

/**
 * Context for the file writer functions
 */
export interface GeneratorOutputFileWriterContext {
  /**
   * Global formatters to use for the file writing
   */
  readonly formatters: GeneratorOutputFormatter[];
  /**
   * Logger to use for the file
   */
  readonly logger: Logger;
  /**
   * Directory to write the file to
   */
  readonly outputDirectory: string;
  /**
   * Previous generated codebase (if any)
   */
  readonly previousGeneratedPayload: PreviousGeneratedPayload | undefined;
  /**
   * Previous working codebase file reader (if any)
   */
  readonly previousWorkingCodebase: CodebaseFileReader | undefined;
  /**
   * A custom merge driver to use instead of the default 3-way merge driver.
   *
   * See https://git-scm.com/docs/gitattributes#_defining_a_custom_merge_driver
   */
  readonly mergeDriver?: GitMergeDriverConfig;
}

/**
 * Generator file operation result
 */
export interface GeneratorFileOperationResult {
  /**
   * Relative path of the file
   */
  relativePath: string;
  /**
   * Previous relative path of the file (if the file was renamed)
   */
  previousRelativePath: string | undefined;
  /**
   * Merged contents of the file (if undefined, the working file version should be used)
   */
  mergedContents: Buffer | undefined;
  /**
   * Generated contents of the file
   */
  generatedContents: Buffer;
  /**
   * The relative path of the file where the generated
   * contents will be written to (in case of a binary conflict)
   */
  generatedConflictRelativePath?: string;
  /**
   * Whether the file has a conflict
   */
  hasConflict?: boolean;
  /**
   * Whether the file was deleted in the working codebase but modified in the generated codebase
   */
  deletedInWorking?: boolean;
}
